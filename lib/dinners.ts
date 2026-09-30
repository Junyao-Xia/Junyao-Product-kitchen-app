import { compareISODates } from "@/lib/dates";
import { isCookable } from "@/lib/ingredient-groups";
import type { Dinner, Ingredient } from "@/lib/types";

export function normalizeIngredientName(name: string): string {
  return name.trim().toLowerCase();
}

export function findIngredientByName(
  ingredients: Ingredient[],
  name: string,
): Ingredient | undefined {
  const target = normalizeIngredientName(name);
  return ingredients.find(
    (item) => normalizeIngredientName(item.name) === target,
  );
}

export function isDinnerEligible(
  dinner: Dinner,
  ingredients: Ingredient[],
  today: string,
): boolean {
  if (dinner.minutes > 20) {
    return false;
  }
  return dinner.ingredientNames.every((name) => {
    const match = findIngredientByName(ingredients, name);
    return match !== undefined && isCookable(match, today);
  });
}

export function dinnerPriorityDate(
  dinner: Dinner,
  ingredients: Ingredient[],
): string | null {
  const dates = dinner.ingredientNames
    .map((name) => findIngredientByName(ingredients, name))
    .filter((item): item is Ingredient => item !== undefined)
    .map((item) => item.reminderDate);

  if (dates.length === 0) {
    return null;
  }
  return dates.sort(compareISODates)[0];
}

export function rankSuggestedDinners(
  dinners: Dinner[],
  ingredients: Ingredient[],
  today: string,
  limit = 3,
): Dinner[] {
  return dinners
    .filter((dinner) => isDinnerEligible(dinner, ingredients, today))
    .sort((a, b) => {
      const aDate = dinnerPriorityDate(a, ingredients);
      const bDate = dinnerPriorityDate(b, ingredients);
      if (aDate && bDate) {
        const byDate = compareISODates(aDate, bDate);
        if (byDate !== 0) {
          return byDate;
        }
        return a.name.localeCompare(b.name);
      }
      if (aDate) {
        return -1;
      }
      if (bDate) {
        return 1;
      }
      return a.name.localeCompare(b.name);
    })
    .slice(0, limit);
}
