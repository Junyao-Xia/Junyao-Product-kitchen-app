import { isCookable } from "@/lib/ingredient-groups";
import type { Ingredient } from "@/lib/types";

export function listCookableIngredientNames(
  ingredients: Ingredient[],
  today: string,
): string[] {
  return ingredients
    .filter((item) => isCookable(item, today))
    .map((item) => item.name)
    .sort((a, b) => a.localeCompare(b));
}
