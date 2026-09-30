import type { Ingredient } from "@/lib/types";

export function buildIngredientFingerprint(ingredients: Ingredient[]): string {
  return ingredients
    .map(
      (item) =>
        `${item.id}|${item.name.trim()}|${item.reminderDate}|${item.status}`,
    )
    .sort((a, b) => a.localeCompare(b))
    .join("\n");
}
