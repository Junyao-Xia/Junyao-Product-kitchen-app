import { ASSUMED_PANTRY_STAPLES } from "@/lib/assumed-pantry";
import { listCookableIngredientNames } from "@/lib/cookable-ingredients";
import { fetchChatCompletion, getOpenAIApiKey } from "@/lib/openai";
import { normalizeIngredientName } from "@/lib/dinners";
import {
  snapshotToIngredients,
  stepsReferenceOnlyListedIngredients,
  validateSuggestItem,
  type RawSuggestItem,
} from "@/lib/suggest-dinners";
import type { Dinner, IngredientSnapshotItem } from "@/lib/types";

export const MAX_SIMPLIFY_LINES = 6;
export const MAX_SIMPLIFY_WORDS = 120;

export const SIMPLIFY_USER_ERROR =
  "Could not get a simpler version. Use the steps above.";

const SAFETY_PATTERN =
  /\b(safe to eat|unsafe|spoiled|expired|food poisoning|gone bad|still good to eat|not safe)\b/i;

export type SimplifySuccess = {
  ok: true;
  lines: string[];
};

export type SimplifyFailureReason =
  | "missing_api_key"
  | "openai_error"
  | "empty_response"
  | "safety_language"
  | "too_few_steps"
  | "too_long"
  | "step_ingredients";

export type SimplifyFailure = {
  ok: false;
  error: string;
  reason?: SimplifyFailureReason;
};

export type SimplifyResult = SimplifySuccess | SimplifyFailure;

export type SimplifyMeal = Pick<
  Dinner,
  "name" | "minutes" | "ingredientNames" | "steps"
>;

export type SimplifyRequest = {
  dinnerId: string;
  cookableIngredientNames: string[];
};

export function findDinnerById(
  dinners: Dinner[],
  dinnerId: string,
): Dinner | undefined {
  return dinners.find((dinner) => dinner.id === dinnerId);
}

export function buildSimplifySystemPrompt(): string {
  return [
    "You help a college student cook a quick dinner after class.",
    "Rewrite the meal as simpler numbered steps using the listed available ingredients plus assumed staples: cooking oil, salt, and black pepper.",
    "Do not use any other ingredients or seasonings.",
    "Target about 20 minutes total.",
    "Use at most 6 short steps and at most 120 words.",
    "Do not mention food safety, spoilage, expiration, or whether ingredients are safe or unsafe.",
    "Do not suggest buying new ingredients.",
    "Return plain numbered steps only, one step per line.",
  ].join(" ");
}

export function buildSimplifyUserPrompt(
  dinner: SimplifyMeal,
  cookableIngredientNames: string[],
): string {
  return [
    `Dinner: ${dinner.name}`,
    `Time budget: ${dinner.minutes} minutes`,
    `Available ingredients: ${cookableIngredientNames.join(", ")}`,
    `Assumed staples (always OK): ${ASSUMED_PANTRY_STAPLES.join(", ")}`,
    "Original steps:",
    ...dinner.steps.map((step, index) => `${index + 1}. ${step}`),
    "Write a simpler version.",
  ].join("\n");
}

export function allowedSimplifyIngredientNames(
  dinner: SimplifyMeal,
  cookableIngredientNames: string[],
): string[] {
  const cookableLower = new Set(
    cookableIngredientNames.map((name) => normalizeIngredientName(name)),
  );
  const dishCookable = dinner.ingredientNames.filter((name) =>
    cookableLower.has(normalizeIngredientName(name)),
  );
  return [...new Set([...dishCookable, ...ASSUMED_PANTRY_STAPLES])];
}

export function parseSimplifyResponse(
  raw: string,
  allowedIngredientNames: string[],
  cookableIngredientNames: string[],
): SimplifyResult {
  const trimmed = raw.trim();
  if (!trimmed) {
    return { ok: false, error: SIMPLIFY_USER_ERROR, reason: "empty_response" };
  }
  if (SAFETY_PATTERN.test(trimmed)) {
    return { ok: false, error: SIMPLIFY_USER_ERROR, reason: "safety_language" };
  }

  const lines = trimmed
    .split(/\r?\n/)
    .map((line) => line.replace(/^\s*\d+[\).\s]+/, "").trim())
    .filter(Boolean);

  if (lines.length < 2) {
    return { ok: false, error: SIMPLIFY_USER_ERROR, reason: "too_few_steps" };
  }

  const limitedLines = lines.slice(0, MAX_SIMPLIFY_LINES);
  const wordCount = limitedLines.join(" ").split(/\s+/).filter(Boolean).length;
  if (wordCount > MAX_SIMPLIFY_WORDS) {
    return { ok: false, error: SIMPLIFY_USER_ERROR, reason: "too_long" };
  }

  if (limitedLines.some((line) => SAFETY_PATTERN.test(line))) {
    return { ok: false, error: SIMPLIFY_USER_ERROR, reason: "safety_language" };
  }

  if (
    !stepsReferenceOnlyListedIngredients(
      limitedLines,
      allowedIngredientNames,
      cookableIngredientNames,
    )
  ) {
    return { ok: false, error: SIMPLIFY_USER_ERROR, reason: "step_ingredients" };
  }

  return { ok: true, lines: limitedLines };
}

export type ValidatedSeededSimplifyRequest = {
  type: "seeded";
  dinnerId: string;
  cookableIngredientNames: string[];
};

export type ValidatedAiSimplifyRequest = {
  type: "ai";
  meal: SimplifyMeal;
  cookableIngredientNames: string[];
};

export type ValidatedSimplifyRequest =
  | ValidatedSeededSimplifyRequest
  | ValidatedAiSimplifyRequest;

export function isSimplifyRequestFailure(
  value: ValidatedSimplifyRequest | SimplifyFailure,
): value is SimplifyFailure {
  return "ok" in value && value.ok === false;
}

function parseIngredientSnapshot(body: Record<string, unknown>): {
  today: string;
  ingredients: IngredientSnapshotItem[];
} | null {
  const today = typeof body.today === "string" ? body.today.trim() : "";
  if (!today || !Array.isArray(body.ingredients)) {
    return null;
  }
  const ingredients: IngredientSnapshotItem[] = [];
  for (const entry of body.ingredients) {
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

export function validateSubmittedAiMealForSimplify(
  raw: unknown,
  cookableNames: string[],
): SimplifyMeal | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }
  const validated = validateSuggestItem(raw as RawSuggestItem, cookableNames);
  if (!validated) {
    return null;
  }
  return {
    name: validated.name,
    minutes: validated.minutes,
    ingredientNames: validated.ingredientNames,
    steps: validated.steps,
  };
}

export function validateSimplifyRequest(
  body: unknown,
): ValidatedSimplifyRequest | SimplifyFailure {
  if (!body || typeof body !== "object") {
    return { ok: false, error: SIMPLIFY_USER_ERROR };
  }
  const record = body as Record<string, unknown>;
  const aiDinner = record.aiDinner;

  if (aiDinner !== undefined) {
    const snapshot = parseIngredientSnapshot(record);
    if (!snapshot) {
      return { ok: false, error: SIMPLIFY_USER_ERROR };
    }
    const ingredientList = snapshotToIngredients(snapshot.ingredients);
    const cookableIngredientNames = listCookableIngredientNames(
      ingredientList,
      snapshot.today,
    );
    if (cookableIngredientNames.length === 0) {
      return { ok: false, error: SIMPLIFY_USER_ERROR };
    }
    const meal = validateSubmittedAiMealForSimplify(
      aiDinner,
      cookableIngredientNames,
    );
    if (!meal) {
      return { ok: false, error: SIMPLIFY_USER_ERROR };
    }
    return { type: "ai", meal, cookableIngredientNames };
  }

  const dinnerId =
    typeof record.dinnerId === "string" ? record.dinnerId.trim() : "";
  if (!dinnerId) {
    return { ok: false, error: SIMPLIFY_USER_ERROR };
  }
  if (!Array.isArray(record.cookableIngredientNames)) {
    return { ok: false, error: SIMPLIFY_USER_ERROR };
  }
  const cookableIngredientNames = record.cookableIngredientNames
    .filter((name): name is string => typeof name === "string")
    .map((name) => name.trim())
    .filter(Boolean);
  if (cookableIngredientNames.length === 0) {
    return { ok: false, error: SIMPLIFY_USER_ERROR };
  }
  return { type: "seeded", dinnerId, cookableIngredientNames };
}

export type ChatCompletionFn = (
  system: string,
  user: string,
  apiKey: string,
) => Promise<string>;

export async function simplifyMealWithOpenAI(
  meal: SimplifyMeal,
  cookableIngredientNames: string[],
  chatCompletion: ChatCompletionFn = fetchChatCompletion,
): Promise<SimplifyResult> {
  const apiKey = getOpenAIApiKey();
  if (!apiKey) {
    return { ok: false, error: SIMPLIFY_USER_ERROR, reason: "missing_api_key" };
  }

  try {
    const raw = await chatCompletion(
      buildSimplifySystemPrompt(),
      buildSimplifyUserPrompt(meal, cookableIngredientNames),
      apiKey,
    );
    const allowed = allowedSimplifyIngredientNames(
      meal,
      cookableIngredientNames,
    );
    return parseSimplifyResponse(raw, allowed, cookableIngredientNames);
  } catch {
    return { ok: false, error: SIMPLIFY_USER_ERROR, reason: "openai_error" };
  }
}

export async function simplifyDinnerWithOpenAI(
  dinner: Dinner,
  cookableIngredientNames: string[],
  chatCompletion: ChatCompletionFn = fetchChatCompletion,
): Promise<SimplifyResult> {
  return simplifyMealWithOpenAI(dinner, cookableIngredientNames, chatCompletion);
}
