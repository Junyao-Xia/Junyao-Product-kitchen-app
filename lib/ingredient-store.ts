import { addDays, toISODate } from "@/lib/dates";
import type { Ingredient, SeedIngredient } from "@/lib/types";

export const INGREDIENTS_STORAGE_KEY = "fridge-ingredients-v1";

export function hydrateSeedIngredients(
  seed: SeedIngredient[],
  firstOpenDate: string,
): Ingredient[] {
  return seed.map((item) => ({
    id: item.id,
    name: item.name,
    reminderDate: addDays(firstOpenDate, item.reminderOffsetDays),
    status: item.status,
  }));
}

export function readStoredIngredients(
  storage: Storage,
): Ingredient[] | null {
  const raw = storage.getItem(INGREDIENTS_STORAGE_KEY);
  if (!raw) {
    return null;
  }
  try {
    const parsed = JSON.parse(raw) as Ingredient[];
    if (!Array.isArray(parsed)) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function writeStoredIngredients(
  storage: Storage,
  ingredients: Ingredient[],
): void {
  storage.setItem(INGREDIENTS_STORAGE_KEY, JSON.stringify(ingredients));
}

export function loadOrInitializeIngredients(
  storage: Storage,
  seed: SeedIngredient[],
  today = toISODate(new Date()),
): Ingredient[] {
  const existing = readStoredIngredients(storage);
  if (existing) {
    return existing;
  }
  const hydrated = hydrateSeedIngredients(seed, today);
  writeStoredIngredients(storage, hydrated);
  return hydrated;
}

export function createIngredientId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `ingredient-${Date.now()}`;
}
