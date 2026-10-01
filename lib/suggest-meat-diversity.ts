import { normalizeIngredientName } from "@/lib/dinners";
import {
  findCookableMentionsInText,
  ingredientMentionedInText,
  MAX_SUGGESTIONS,
} from "@/lib/suggest-dinners";
import { QUICK_SELECT_MEATS } from "@/lib/quick-select-meats";
import type { AiDinnerSuggestion } from "@/lib/types";

export function isQuickSelectMeatName(name: string): boolean {
  const target = normalizeIngredientName(name);
  return QUICK_SELECT_MEATS.some(
    (meat) => normalizeIngredientName(meat) === target,
  );
}

export function listCookableQuickSelectMeats(cookableNames: string[]): string[] {
  return cookableNames.filter((name) => isQuickSelectMeatName(name));
}

export function countMeatsInIngredientNames(ingredientNames: string[]): number {
  return ingredientNames.filter((name) => isQuickSelectMeatName(name)).length;
}

export function prioritizeMeatsForSuggest(
  meats: string[],
  useSoonNames: string[],
): string[] {
  const useSoonSet = new Set(
    useSoonNames.map((name) => normalizeIngredientName(name)),
  );
  return [...meats]
    .sort((a, b) => {
      const aSoon = useSoonSet.has(normalizeIngredientName(a)) ? 0 : 1;
      const bSoon = useSoonSet.has(normalizeIngredientName(b)) ? 0 : 1;
      if (aSoon !== bSoon) {
        return aSoon - bSoon;
      }
      return a.localeCompare(b);
    })
    .slice(0, 3);
}

export type MeatDiversityPlan = {
  /** Up to three meats to feature (Use soon first). Empty when no meats are cookable. */
  focusMeats: string[];
  cookableMeatCount: number;
};

export function buildMeatDiversityPlan(
  cookableNames: string[],
  useSoonNames: string[],
): MeatDiversityPlan {
  const cookableMeats = listCookableQuickSelectMeats(cookableNames);
  return {
    focusMeats: prioritizeMeatsForSuggest(cookableMeats, useSoonNames),
    cookableMeatCount: cookableMeats.length,
  };
}

export function primaryMeatForSuggestion(
  suggestion: AiDinnerSuggestion,
  cookableNames: string[],
): string | null {
  for (const name of suggestion.ingredientNames) {
    if (isQuickSelectMeatName(name)) {
      return name;
    }
  }
  const text = [suggestion.name, ...suggestion.steps].join(" ");
  for (const meat of listCookableQuickSelectMeats(cookableNames)) {
    if (ingredientMentionedInText(meat, text)) {
      return meat;
    }
  }
  return null;
}

function uniquePrimaryMeats(
  suggestions: AiDinnerSuggestion[],
  cookableNames: string[],
): string[] {
  const seen = new Set<string>();
  const primaries: string[] = [];
  for (const item of suggestions) {
    const meat = primaryMeatForSuggestion(item, cookableNames);
    if (!meat) {
      continue;
    }
    const key = normalizeIngredientName(meat);
    if (!seen.has(key)) {
      seen.add(key);
      primaries.push(meat);
    }
  }
  return primaries;
}

function suggestionPassesSingleMeatRule(
  suggestion: AiDinnerSuggestion,
): boolean {
  return countMeatsInIngredientNames(suggestion.ingredientNames) <= 1;
}

function meetsSingleMeatVariety(
  suggestions: AiDinnerSuggestion[],
): boolean {
  const names = suggestions.map((item) =>
    normalizeIngredientName(item.name),
  );
  return new Set(names).size === suggestions.length;
}

export function meetsMeatDiversityRules(
  suggestions: AiDinnerSuggestion[],
  plan: MeatDiversityPlan,
  cookableNames: string[],
): boolean {
  if (suggestions.length === 0) {
    return false;
  }
  if (!suggestions.every(suggestionPassesSingleMeatRule)) {
    return false;
  }

  const { cookableMeatCount, focusMeats } = plan;
  if (cookableMeatCount === 0) {
    return true;
  }

  const primaries = uniquePrimaryMeats(suggestions, cookableNames);

  if (cookableMeatCount >= 3) {
    const needed = Math.min(
      MAX_SUGGESTIONS,
      suggestions.length,
      focusMeats.length,
    );
    if (primaries.length < needed) {
      return false;
    }
    const focusSet = new Set(
      focusMeats.map((meat) => normalizeIngredientName(meat)),
    );
    return primaries
      .slice(0, needed)
      .every((meat) => focusSet.has(normalizeIngredientName(meat)));
  }

  if (cookableMeatCount === 2) {
    const required = new Set(
      listCookableQuickSelectMeats(cookableNames).map((meat) =>
        normalizeIngredientName(meat),
      ),
    );
    const covered = new Set(
      primaries.map((meat) => normalizeIngredientName(meat)),
    );
    for (const meat of required) {
      if (!covered.has(meat)) {
        return false;
      }
    }
    return true;
  }

  if (cookableMeatCount === 1 && suggestions.length >= 2) {
    return meetsSingleMeatVariety(suggestions);
  }

  return true;
}

export function buildMeatDiversityRetryHint(plan: MeatDiversityPlan): string {
  if (plan.cookableMeatCount >= 3) {
    return [
      "Each suggestion must use exactly one primary meat from the focus list.",
      `Use different primary meats across suggestions: ${plan.focusMeats.join(", ")}.`,
      "Do not combine multiple meats in one recipe.",
    ].join(" ");
  }
  if (plan.cookableMeatCount === 2) {
    return [
      "Include both cookable meats across the suggestions, one primary meat per dish.",
      "Do not combine multiple meats in one recipe.",
    ].join(" ");
  }
  return [
    "Vary the dish names and cooking methods while using the same primary meat.",
    "Do not combine multiple meats in one recipe.",
  ].join(" ");
}

export function buildMeatDiversityPartialMessage(
  returnedCount: number,
  plan: MeatDiversityPlan,
): string {
  if (plan.cookableMeatCount >= 3 && returnedCount < MAX_SUGGESTIONS) {
    return `Showing ${returnedCount} dinner${returnedCount === 1 ? "" : "s"} — could not find ${MAX_SUGGESTIONS} distinct meat options that fit your list.`;
  }
  if (plan.cookableMeatCount === 2 && returnedCount < 2) {
    return `Showing ${returnedCount} dinner — could not fit both meats with your other ingredients.`;
  }
  return `Showing ${returnedCount} dinner${returnedCount === 1 ? "" : "s"} that fit your list.`;
}

function scoreSuggestionForDiversity(
  suggestion: AiDinnerSuggestion,
  plan: MeatDiversityPlan,
  cookableNames: string[],
  usedPrimaries: Set<string>,
): number {
  if (!suggestionPassesSingleMeatRule(suggestion)) {
    return -1;
  }
  const primary = primaryMeatForSuggestion(suggestion, cookableNames);
  if (!primary) {
    return plan.cookableMeatCount === 0 ? 1 : 0;
  }
  const key = normalizeIngredientName(primary);
  if (usedPrimaries.has(key)) {
    return 0;
  }
  const focusIndex = plan.focusMeats.findIndex(
    (meat) => normalizeIngredientName(meat) === key,
  );
  return focusIndex >= 0 ? 10 - focusIndex : 1;
}

export function selectDiverseSuggestSubset(
  suggestions: AiDinnerSuggestion[],
  plan: MeatDiversityPlan,
  cookableNames: string[],
): AiDinnerSuggestion[] {
  const picked: AiDinnerSuggestion[] = [];
  const usedPrimaries = new Set<string>();
  const usedNames = new Set<string>();
  const pool = [...suggestions];

  while (picked.length < MAX_SUGGESTIONS && pool.length > 0) {
    let bestIndex = -1;
    let bestScore = -1;
    for (let index = 0; index < pool.length; index += 1) {
      const candidate = pool[index];
      const nameKey = normalizeIngredientName(candidate.name);
      if (usedNames.has(nameKey)) {
        continue;
      }
      const score = scoreSuggestionForDiversity(
        candidate,
        plan,
        cookableNames,
        usedPrimaries,
      );
      if (score > bestScore) {
        bestScore = score;
        bestIndex = index;
      }
    }
    if (bestIndex < 0 || bestScore < 0) {
      break;
    }
    const [choice] = pool.splice(bestIndex, 1);
    picked.push(choice);
    usedNames.add(normalizeIngredientName(choice.name));
    const primary = primaryMeatForSuggestion(choice, cookableNames);
    if (primary) {
      usedPrimaries.add(normalizeIngredientName(primary));
    }
  }

  return picked;
}

export type ApplyMeatDiversityResult = {
  suggestions: AiDinnerSuggestion[];
  message?: string;
  needsRetry: boolean;
  retryHint: string;
};

export function applyMeatDiversity(
  suggestions: AiDinnerSuggestion[],
  plan: MeatDiversityPlan,
  cookableNames: string[],
): ApplyMeatDiversityResult {
  const retryHint = buildMeatDiversityRetryHint(plan);
  if (plan.cookableMeatCount === 0) {
    return { suggestions, needsRetry: false, retryHint };
  }

  const singleMeatOnly = suggestions.filter(suggestionPassesSingleMeatRule);
  if (meetsMeatDiversityRules(singleMeatOnly, plan, cookableNames)) {
    return { suggestions: singleMeatOnly, needsRetry: false, retryHint };
  }

  const repeatedPrimary =
    singleMeatOnly.length >= 2 &&
    plan.cookableMeatCount >= 2 &&
    uniquePrimaryMeats(singleMeatOnly, cookableNames).length === 1;
  if (repeatedPrimary) {
    return { suggestions: [], needsRetry: true, retryHint };
  }

  const subset = selectDiverseSuggestSubset(
    singleMeatOnly,
    plan,
    cookableNames,
  );
  if (
    subset.length > 0 &&
    meetsMeatDiversityRules(subset, plan, cookableNames)
  ) {
    const message =
      subset.length < singleMeatOnly.length ||
      subset.length < Math.min(MAX_SUGGESTIONS, plan.focusMeats.length || MAX_SUGGESTIONS)
        ? buildMeatDiversityPartialMessage(subset.length, plan)
        : undefined;
    return { suggestions: subset, message, needsRetry: false, retryHint };
  }

  if (subset.length > 0) {
    return {
      suggestions: subset,
      message: buildMeatDiversityPartialMessage(subset.length, plan),
      needsRetry: false,
      retryHint,
    };
  }

  return { suggestions: [], needsRetry: true, retryHint };
}

export function meatDiversityPromptLines(plan: MeatDiversityPlan): string[] {
  if (plan.cookableMeatCount === 0) {
    return [];
  }
  const lines = [
    "Meat diversity rules:",
    "Use at most one quick-select meat (Beef, Pork, Chicken, Duck) per suggestion — never combine meats in one dish.",
  ];
  if (plan.focusMeats.length > 0) {
    lines.push(
      `Focus meats for this request (Use soon first): ${plan.focusMeats.join(", ")}.`,
    );
  }
  if (plan.cookableMeatCount >= 3) {
    lines.push(
      "When three focus meats are listed, return three suggestions with a different primary meat in each whenever feasible.",
    );
  } else if (plan.cookableMeatCount === 2) {
    lines.push(
      "Include both cookable meats across the suggestions, one primary meat per dish.",
    );
  } else if (plan.cookableMeatCount === 1) {
    lines.push(
      "Only one meat is cookable — vary dish style and cooking method across suggestions.",
    );
  }
  return lines;
}

/** Detect extra cookable meats mentioned in steps but not listed on the dish. */
export function stepsIntroduceExtraMeats(
  steps: string[],
  ingredientNames: string[],
  cookableNames: string[],
): boolean {
  const allowedMeats = new Set(
    ingredientNames
      .filter((name) => isQuickSelectMeatName(name))
      .map((name) => normalizeIngredientName(name)),
  );
  const mentioned = findCookableMentionsInText(steps.join(" "), cookableNames);
  for (const name of mentioned) {
    if (!isQuickSelectMeatName(name)) {
      continue;
    }
    const key = normalizeIngredientName(name);
    if (!allowedMeats.has(key)) {
      return true;
    }
  }
  return false;
}
