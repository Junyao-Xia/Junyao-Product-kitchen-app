import { isOnOrAfterToday, parseISODate } from "@/lib/dates";
import { findIngredientByName } from "@/lib/dinners";
import type { Ingredient } from "@/lib/types";

export const DUPLICATE_AVAILABLE_INGREDIENT_MESSAGE =
  "That ingredient is already on your list.";

export type IngredientFieldErrors = {
  name?: string;
  reminderDate?: string;
};

export function validateIngredientFields(
  name: string,
  reminderDate: string,
): IngredientFieldErrors {
  const errors: IngredientFieldErrors = {};
  if (!name.trim()) {
    errors.name = "Enter an ingredient name.";
  }
  if (!reminderDate.trim()) {
    errors.reminderDate = "Choose a reminder date.";
  } else if (!parseISODate(reminderDate.trim())) {
    errors.reminderDate = "Use a valid date.";
  }
  return errors;
}

export function hasFieldErrors(errors: IngredientFieldErrors): boolean {
  return Boolean(errors.name || errors.reminderDate);
}

export function isAvailableIngredientNameOnList(
  ingredients: Ingredient[],
  name: string,
): boolean {
  const match = findIngredientByName(ingredients, name);
  return match !== undefined && match.status === "available";
}

export function validateAddIngredient(
  name: string,
  reminderDate: string,
  ingredients: Ingredient[],
): IngredientFieldErrors {
  const errors = validateIngredientFields(name, reminderDate);
  if (
    !errors.name &&
    isAvailableIngredientNameOnList(ingredients, name.trim())
  ) {
    errors.name = DUPLICATE_AVAILABLE_INGREDIENT_MESSAGE;
  }
  return errors;
}

export function validateKeepDate(
  reminderDate: string,
  today: string,
): IngredientFieldErrors {
  const errors = validateIngredientFields("placeholder", reminderDate);
  if (errors.reminderDate) {
    return { reminderDate: errors.reminderDate };
  }
  if (!isOnOrAfterToday(reminderDate.trim(), today)) {
    return {
      reminderDate: "Choose today or a later date to keep this ingredient.",
    };
  }
  return {};
}
