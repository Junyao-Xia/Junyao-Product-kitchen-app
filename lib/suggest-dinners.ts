import {
  ASSUMED_PANTRY_STAPLES,
  findForbiddenPantryMentions,
  isAssumedPantryStapleName,
  resolveCookableOrAssumedPantryName,
} from "@/lib/assumed-pantry";
import { listCookableIngredientNames } from "@/lib/cookable-ingredients";
import { isUseSoon } from "@/lib/ingredient-groups";
import { fetchChatCompletion, getOpenAIApiKey } from "@/lib/openai";
import { normalizeIngredientName } from "@/lib/dinners";
import { CHICKEN_COOKING_RULE_FOR_AI } from "@/lib/chicken-cooking";
import { extractJsonPayload } from "@/lib/model-json";
import {
  applyMeatDiversity,
  buildMeatDiversityPartialMessage,
  buildMeatDiversityPlan,
  buildMeatDiversityRetryHint,
  countMeatsInIngredientNames,
  meatDiversityPromptLines,
  type ApplyMeatDiversityResult,
} from "@/lib/suggest-meat-diversity";
import type {
  AiDinnerSuggestion,
  Ingredient,
  IngredientSnapshotItem,
} from "@/lib/types";

export const MAX_SUGGEST_MINUTES = 20;
export const MAX_SUGGESTIONS = 3;
export const MIN_STEPS = 2;

export const SUGGEST_USER_ERROR =
  "Could not load dinner suggestions. Try again or use the dinners above.";

export const SUGGEST_NO_COOKABLE_MESSAGE =
  "Add ingredients that are not in Review to get AI dinner ideas.";

export const SUGGEST_NONE_FIT_MESSAGE =
  "Nothing simple fits what you listed. Try adding more ingredients or use the dinners above.";

/** Parse/validation failed — not the same as an empty pantry. */
export const SUGGEST_GENERATION_FAILED = SUGGEST_USER_ERROR;

const SAFETY_PATTERN =
  /\b(safe to eat|unsafe|spoiled|expired|food poisoning|gone bad|still good to eat|not safe)\b/i;

export type SuggestSuccess = {
  ok: true;
  suggestions: AiDinnerSuggestion[];
  message?: string;
};

export type SuggestFailureReason =
  | "parse_retry_exhausted"
  | "validation_empty"
  | "openai_error"
  | "missing_api_key";

export type SuggestFailure = {
  ok: false;
  error: string;
  reason?: SuggestFailureReason;
};

export type SuggestResult = SuggestSuccess | SuggestFailure;

export type RawSuggestPayload = {
  suggestions?: unknown;
  unableReason?: unknown;
};

export type RawSuggestItem = {
  name?: unknown;
  minutes?: unknown;
  ingredientNames?: unknown;
  steps?: unknown;
};

export function snapshotToIngredients(
  snapshot: IngredientSnapshotItem[],
): Ingredient[] {
  return snapshot.map((item) => ({
    id: item.id,
    name: item.name.trim(),
    reminderDate: item.reminderDate,
    status: item.status,
  }));
}

export function listUseSoonIngredientNames(
  ingredients: Ingredient[],
  today: string,
): string[] {
  return ingredients
    .filter((item) => isUseSoon(item, today))
    .map((item) => item.name)
    .sort((a, b) => a.localeCompare(b));
}

export function buildSuggestSystemPrompt(): string {
  return [
    "You help a college student plan quick dinners after class.",
    "Return JSON only, no markdown.",
    `Suggest up to ${MAX_SUGGESTIONS} simple dinners that take at most ${MAX_SUGGEST_MINUTES} minutes each.`,
    `You may also use these assumed staples (user does not list them): ${ASSUMED_PANTRY_STAPLES.join(", ")}.`,
    "All other ingredients must come from the available list only.",
    "Prioritize using ingredients marked Use soon when possible.",
    "Use at most one quick-select meat (Beef, Pork, Chicken, Duck) per suggestion — never combine multiple meats in one dish.",
    "When several meats are available, vary the primary meat across suggestions instead of repeating the same meat.",
    "Each suggestion needs: name, minutes (integer), ingredientNames (from available plus optional assumed staples), steps (at least 2 short strings).",
    "Steps may use only ingredients from that suggestion's ingredientNames.",
    "Do not mention food safety, spoilage, or expiration.",
    CHICKEN_COOKING_RULE_FOR_AI,
    "If nothing honest fits, return suggestions as [] and set unableReason to a short plain explanation.",
    'JSON shape: {"suggestions":[...],"unableReason":null|string}',
  ].join(" ");
}

export function buildSuggestUserPrompt(
  cookableNames: string[],
  useSoonNames: string[],
  diversityLines: string[] = [],
): string {
  return [
    `Available ingredients: ${cookableNames.join(", ")}`,
    useSoonNames.length > 0
      ? `Use soon (prioritize): ${useSoonNames.join(", ")}`
      : "Use soon: none",
    ...diversityLines,
    "Return dinner suggestions as JSON.",
  ].join("\n");
}

export function resolveCanonicalCookableName(
  name: string,
  cookableNames: string[],
): string | null {
  const target = normalizeIngredientName(name);
  const match = cookableNames.find(
    (item) => normalizeIngredientName(item) === target,
  );
  return match ?? null;
}

export function ingredientMentionedInText(name: string, text: string): boolean {
  if (isAssumedPantryStapleName(name)) {
    return false;
  }
  const normalized = normalizeIngredientName(name);
  if (normalized.length < 2) {
    return false;
  }
  const haystack = text.toLowerCase();
  const fullPattern = new RegExp(`\\b${escapeRegExp(normalized)}\\b`, "i");
  if (fullPattern.test(haystack)) {
    return true;
  }
  const words = normalized.split(/\s+/).filter((word) => word.length >= 3);
  return words.some((word) => {
    const pattern = new RegExp(`\\b${escapeRegExp(word)}\\b`, "i");
    return pattern.test(haystack);
  });
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function findCookableMentionsInText(
  text: string,
  cookableNames: string[],
): string[] {
  const mentioned: string[] = [];
  for (const name of cookableNames) {
    if (ingredientMentionedInText(name, text)) {
      mentioned.push(name);
    }
  }
  return mentioned;
}

export function stepsReferenceOnlyListedIngredients(
  steps: string[],
  ingredientNames: string[],
  cookableNames: string[],
): boolean {
  const allowed = new Set(
    ingredientNames.map((name) => normalizeIngredientName(name)),
  );
  const stepText = steps.join(" ");

  if (findForbiddenPantryMentions(stepText, cookableNames).length > 0) {
    return false;
  }

  const mentioned = findCookableMentionsInText(stepText, cookableNames);
  for (const name of mentioned) {
    const canonical = normalizeIngredientName(name);
    const inDish = [...allowed].some(
      (item) => item === canonical || canonical.includes(item) || item.includes(canonical),
    );
    if (!inDish) {
      return false;
    }
  }

  return true;
}

export function validateSuggestItem(
  raw: RawSuggestItem,
  cookableNames: string[],
): AiDinnerSuggestion | null {
  const name = typeof raw.name === "string" ? raw.name.trim() : "";
  if (!name || SAFETY_PATTERN.test(name)) {
    return null;
  }

  const minutes =
    typeof raw.minutes === "number"
      ? raw.minutes
      : typeof raw.minutes === "string"
        ? Number.parseInt(raw.minutes, 10)
        : NaN;
  if (!Number.isFinite(minutes) || minutes < 1 || minutes > MAX_SUGGEST_MINUTES) {
    return null;
  }

  if (!Array.isArray(raw.ingredientNames) || !Array.isArray(raw.steps)) {
    return null;
  }

  const ingredientNames: string[] = [];
  let hasCookableFromList = false;
  for (const entry of raw.ingredientNames) {
    if (typeof entry !== "string") {
      return null;
    }
    const canonical = resolveCookableOrAssumedPantryName(entry, cookableNames);
    if (!canonical) {
      return null;
    }
    if (!isAssumedPantryStapleName(canonical)) {
      hasCookableFromList = true;
    }
    if (!ingredientNames.includes(canonical)) {
      ingredientNames.push(canonical);
    }
  }
  if (!hasCookableFromList || ingredientNames.length === 0) {
    return null;
  }

  if (countMeatsInIngredientNames(ingredientNames) > 1) {
    return null;
  }

  const steps = raw.steps
    .filter((step): step is string => typeof step === "string")
    .map((step) => step.trim())
    .filter(Boolean);

  if (steps.length < MIN_STEPS) {
    return null;
  }

  const combined = [name, ...ingredientNames, ...steps].join(" ");
  if (SAFETY_PATTERN.test(combined)) {
    return null;
  }

  if (!stepsReferenceOnlyListedIngredients(steps, ingredientNames, cookableNames)) {
    return null;
  }

  return {
    id: "",
    name,
    minutes,
    ingredientNames,
    steps,
  };
}

export type ExtractValidMealsResult =
  | { kind: "parse_error" }
  | { kind: "no_valid"; unableReason: string }
  | { kind: "ok"; suggestions: AiDinnerSuggestion[] };

export function extractValidMealsFromSuggestRaw(
  raw: string,
  cookableNames: string[],
): ExtractValidMealsResult {
  let payload: RawSuggestPayload;
  try {
    payload = JSON.parse(extractJsonPayload(raw)) as RawSuggestPayload;
  } catch {
    return { kind: "parse_error" };
  }

  if (!payload || typeof payload !== "object") {
    return { kind: "parse_error" };
  }

  const unableReason =
    typeof payload.unableReason === "string"
      ? payload.unableReason.trim()
      : "";

  if (!Array.isArray(payload.suggestions)) {
    return {
      kind: "no_valid",
      unableReason: unableReason || SUGGEST_NONE_FIT_MESSAGE,
    };
  }

  const suggestions: AiDinnerSuggestion[] = [];
  for (const entry of payload.suggestions.slice(0, MAX_SUGGESTIONS)) {
    if (!entry || typeof entry !== "object") {
      continue;
    }
    const validated = validateSuggestItem(entry as RawSuggestItem, cookableNames);
    if (validated) {
      suggestions.push(validated);
    }
  }

  if (suggestions.length === 0) {
    return {
      kind: "no_valid",
      unableReason: unableReason || SUGGEST_GENERATION_FAILED,
    };
  }

  return { kind: "ok", suggestions };
}

export function parseSuggestResponse(
  raw: string,
  cookableNames: string[],
): SuggestResult {
  const extracted = extractValidMealsFromSuggestRaw(raw, cookableNames);
  if (extracted.kind === "parse_error") {
    return { ok: false, error: SUGGEST_GENERATION_FAILED };
  }
  if (extracted.kind === "no_valid") {
    return {
      ok: false,
      error: extracted.unableReason || SUGGEST_GENERATION_FAILED,
    };
  }
  return { ok: true, suggestions: extracted.suggestions };
}

export type SuggestRequestBody = {
  today: string;
  ingredients: IngredientSnapshotItem[];
};

export function isSuggestRequestFailure(
  value: SuggestRequestBody | SuggestFailure,
): value is SuggestFailure {
  return "ok" in value && value.ok === false;
}

export function validateSuggestRequest(body: unknown): SuggestRequestBody | SuggestFailure {
  if (!body || typeof body !== "object") {
    return { ok: false, error: SUGGEST_USER_ERROR };
  }
  const record = body as Record<string, unknown>;
  const today = typeof record.today === "string" ? record.today.trim() : "";
  if (!today) {
    return { ok: false, error: SUGGEST_USER_ERROR };
  }
  if (!Array.isArray(record.ingredients)) {
    return { ok: false, error: SUGGEST_USER_ERROR };
  }
  const ingredients: IngredientSnapshotItem[] = [];
  for (const entry of record.ingredients) {
    if (!entry || typeof entry !== "object") {
      continue;
    }
    const item = entry as Record<string, unknown>;
    const id = typeof item.id === "string" ? item.id.trim() : "";
    const name = typeof item.name === "string" ? item.name.trim() : "";
    const reminderDate =
      typeof item.reminderDate === "string" ? item.reminderDate.trim() : "";
    const status = item.status;
    if (
      !id ||
      !name ||
      !reminderDate ||
      (status !== "available" && status !== "used")
    ) {
      continue;
    }
    ingredients.push({ id, name, reminderDate, status });
  }
  return { today, ingredients };
}

export type ChatCompletionFn = (
  system: string,
  user: string,
  apiKey: string,
) => Promise<string>;

async function defaultSuggestChatCompletion(
  system: string,
  user: string,
  apiKey: string,
): Promise<string> {
  return fetchChatCompletion(system, user, apiKey, { jsonObject: true });
}

export function assignSuggestionIds(
  suggestions: AiDinnerSuggestion[],
): AiDinnerSuggestion[] {
  return suggestions.map((item, index) => ({
    ...item,
    id: `ai-${index}-${normalizeIngredientName(item.name).replace(/\s+/g, "-")}`,
  }));
}

const SUGGEST_PARSE_RETRY_HINT =
  "Return JSON only (no markdown). Shape: {\"suggestions\":[...],\"unableReason\":null}. Each suggestion uses at most one quick-select meat, only listed ingredients plus assumed staples, and steps that mention only those ingredients.";

const SUGGEST_VALIDATION_RETRY_HINT =
  "Each suggestion must pass: integer minutes 1–20, at least two steps, one cookable ingredient from the list, at most one meat per dish, no extra ingredients in steps.";

function buildRetryHintFromExtract(
  extracted: ExtractValidMealsResult,
  diversityPlan: ReturnType<typeof buildMeatDiversityPlan>,
): string {
  if (extracted.kind === "parse_error") {
    return SUGGEST_PARSE_RETRY_HINT;
  }
  if (extracted.kind === "no_valid" && extracted.unableReason) {
    return `${extracted.unableReason} ${SUGGEST_VALIDATION_RETRY_HINT}`;
  }
  return buildMeatDiversityRetryHint(diversityPlan);
}

function suggestFromModelRaw(
  raw: string,
  cookableNames: string[],
  diversityPlan: ReturnType<typeof buildMeatDiversityPlan>,
): ApplyMeatDiversityResult {
  const extracted = extractValidMealsFromSuggestRaw(raw, cookableNames);
  const retryHint = buildRetryHintFromExtract(extracted, diversityPlan);

  if (extracted.kind !== "ok") {
    return {
      suggestions: [],
      needsRetry: true,
      retryHint,
    };
  }

  return applyMeatDiversity(extracted.suggestions, diversityPlan, cookableNames);
}

function diversityToSuggestResult(
  diversity: ApplyMeatDiversityResult,
  failureReason?: SuggestFailureReason,
): SuggestResult {
  if (diversity.suggestions.length === 0) {
    return {
      ok: false,
      error: SUGGEST_GENERATION_FAILED,
      reason: failureReason ?? "validation_empty",
    };
  }
  return {
    ok: true,
    suggestions: assignSuggestionIds(diversity.suggestions),
    message: diversity.message,
  };
}

function mergeSuggestionLists(
  primary: AiDinnerSuggestion[],
  secondary: AiDinnerSuggestion[],
): AiDinnerSuggestion[] {
  const seen = new Set<string>();
  const merged: AiDinnerSuggestion[] = [];
  for (const item of [...primary, ...secondary]) {
    const key = normalizeIngredientName(item.name);
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    merged.push(item);
  }
  return merged.slice(0, MAX_SUGGESTIONS);
}

export async function suggestDinnersWithOpenAI(
  ingredients: Ingredient[],
  today: string,
  chatCompletion: ChatCompletionFn = defaultSuggestChatCompletion,
): Promise<SuggestResult> {
  const cookableNames = listCookableIngredientNames(ingredients, today);
  if (cookableNames.length === 0) {
    return { ok: false, error: SUGGEST_NO_COOKABLE_MESSAGE };
  }

  const apiKey = getOpenAIApiKey();
  if (!apiKey) {
    return { ok: false, error: SUGGEST_USER_ERROR, reason: "missing_api_key" };
  }

  const useSoonNames = listUseSoonIngredientNames(ingredients, today);
  const diversityPlan = buildMeatDiversityPlan(cookableNames, useSoonNames);
  const diversityLines = meatDiversityPromptLines(diversityPlan);
  const system = buildSuggestSystemPrompt();
  const user = buildSuggestUserPrompt(cookableNames, useSoonNames, diversityLines);

  try {
    let raw = await chatCompletion(system, user, apiKey);
    let outcome = suggestFromModelRaw(raw, cookableNames, diversityPlan);
    let collected = outcome.suggestions;

    if (collected.length === 0) {
      raw = await chatCompletion(
        system,
        `${user}\n\nCorrection: ${outcome.retryHint}`,
        apiKey,
      );
      const secondOutcome = suggestFromModelRaw(raw, cookableNames, diversityPlan);
      collected = mergeSuggestionLists(secondOutcome.suggestions, collected);
    }

    let diversity = applyMeatDiversity(collected, diversityPlan, cookableNames);
    if (diversity.suggestions.length === 0 && collected.length > 0) {
      diversity = {
        suggestions: collected.slice(0, MAX_SUGGESTIONS),
        needsRetry: false,
        retryHint: diversity.retryHint,
        message: buildMeatDiversityPartialMessage(
          Math.min(collected.length, MAX_SUGGESTIONS),
          diversityPlan,
        ),
      };
    }

    return diversityToSuggestResult(
      diversity,
      diversity.suggestions.length === 0 ? "parse_retry_exhausted" : undefined,
    );
  } catch {
    return { ok: false, error: SUGGEST_USER_ERROR, reason: "openai_error" };
  }
}
