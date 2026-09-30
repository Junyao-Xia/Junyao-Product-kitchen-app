import { addDays, compareISODates, isBeforeToday } from "@/lib/dates";
import type { Ingredient } from "@/lib/types";

export const USE_SOON_WINDOW_DAYS = 2;

export function isInReview(
  ingredient: Ingredient,
  today: string,
): boolean {
  return (
    ingredient.status === "available" &&
    isBeforeToday(ingredient.reminderDate, today)
  );
}

export function isUseSoon(
  ingredient: Ingredient,
  today: string,
): boolean {
  if (ingredient.status !== "available") {
    return false;
  }
  if (isBeforeToday(ingredient.reminderDate, today)) {
    return false;
  }
  const lastSoonDay = addDays(today, USE_SOON_WINDOW_DAYS);
  return compareISODates(ingredient.reminderDate, lastSoonDay) <= 0;
}

export function isCookable(ingredient: Ingredient, today: string): boolean {
  return (
    ingredient.status === "available" &&
    !isBeforeToday(ingredient.reminderDate, today)
  );
}

export function partitionIngredients(
  ingredients: Ingredient[],
  today: string,
): {
  review: Ingredient[];
  useSoon: Ingredient[];
  other: Ingredient[];
} {
  const available = ingredients.filter((item) => item.status === "available");
  const review = available
    .filter((item) => isInReview(item, today))
    .sort((a, b) => compareISODates(a.reminderDate, b.reminderDate));
  const useSoon = available
    .filter((item) => isUseSoon(item, today))
    .sort((a, b) => compareISODates(a.reminderDate, b.reminderDate));
  const flagged = new Set([...review, ...useSoon].map((item) => item.id));
  const other = available
    .filter((item) => !flagged.has(item.id))
    .sort((a, b) => compareISODates(a.reminderDate, b.reminderDate));

  return { review, useSoon, other };
}
