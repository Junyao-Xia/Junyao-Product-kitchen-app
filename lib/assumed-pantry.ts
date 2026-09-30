import { normalizeIngredientName } from "@/lib/dinners";

/** Always available for AI suggest and Make it simpler — not stored on the ingredient list. */
export const ASSUMED_PANTRY_STAPLES = [
  "Cooking oil",
  "Salt",
  "Black pepper",
] as const;

export type AssumedPantryStaple = (typeof ASSUMED_PANTRY_STAPLES)[number];

export const ASSUMED_PANTRY_NOTE =
  "Assumes cooking oil, salt, and black pepper.";

/**
 * OK in recipe steps without being on the ingredient list (not shown in the UI note).
 * Water is for boiling/simmering — not treated as an extra shopping ingredient.
 */
export const IMPLICIT_STEP_TERMS = ["water"] as const;

/** Pantry words that are never assumed — must appear on the cookable list to be allowed. */
export const EXTRA_PANTRY_TERMS = [
  "olive oil",
  "vegetable oil",
  "soy sauce",
  "garlic powder",
  "onion powder",
  "butter",
  "sugar",
  "flour",
  "vinegar",
  "garlic",
] as const;

export function isAssumedPantryStapleName(name: string): boolean {
  const target = normalizeIngredientName(name);
  return ASSUMED_PANTRY_STAPLES.some(
    (staple) => normalizeIngredientName(staple) === target,
  );
}

export function resolveAssumedPantryStaple(name: string): AssumedPantryStaple | null {
  const trimmed = name.trim();
  if (!trimmed) {
    return null;
  }
  const normalized = normalizeIngredientName(trimmed);
  if (isAssumedPantryStapleName(trimmed)) {
    return ASSUMED_PANTRY_STAPLES.find(
      (staple) => normalizeIngredientName(staple) === normalized,
    )!;
  }
  if (normalized === "cooking oil" || normalized === "oil") {
    return "Cooking oil";
  }
  if (normalized === "salt") {
    return "Salt";
  }
  if (normalized === "black pepper" || normalized === "pepper") {
    return "Black pepper";
  }
  return null;
}

export function resolveCookableOrAssumedPantryName(
  name: string,
  cookableNames: string[],
): string | null {
  const pantry = resolveAssumedPantryStaple(name);
  if (pantry) {
    return pantry;
  }
  const target = normalizeIngredientName(name);
  const match = cookableNames.find(
    (item) => normalizeIngredientName(item) === target,
  );
  return match ?? null;
}

export function findForbiddenPantryMentions(
  text: string,
  cookableNames: string[],
): string[] {
  const cookableNormalized = new Set(
    cookableNames.map((name) => normalizeIngredientName(name)),
  );
  const haystack = text.toLowerCase();
  const hits: string[] = [];
  for (const term of EXTRA_PANTRY_TERMS) {
    if ((IMPLICIT_STEP_TERMS as readonly string[]).includes(term)) {
      continue;
    }
    if (!haystack.includes(term)) {
      continue;
    }
    const onList = [...cookableNormalized].some(
      (name) => name.includes(term) || term.includes(name),
    );
    if (!onList) {
      hits.push(term);
    }
  }
  return hits;
}
