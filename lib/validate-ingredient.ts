import { isOnOrAfterToday, parseISODate } from "@/lib/dates";

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
