import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createIngredientId,
  hydrateSeedIngredients,
  INGREDIENTS_STORAGE_KEY,
  loadOrInitializeIngredients,
  readStoredIngredients,
  writeStoredIngredients,
} from "@/lib/ingredient-store";
import type { SeedIngredient } from "@/lib/types";

const seed: SeedIngredient[] = [
  {
    id: "seed-spinach",
    name: "Spinach",
    reminderOffsetDays: -1,
    status: "available",
  },
  {
    id: "seed-chicken",
    name: "Chicken",
    reminderOffsetDays: 1,
    status: "available",
  },
];

describe("ingredient store", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("hydrates seed offsets from the first-open date", () => {
    const hydrated = hydrateSeedIngredients(seed, "2026-09-29");
    expect(hydrated[0].reminderDate).toBe("2026-09-28");
    expect(hydrated[1].reminderDate).toBe("2026-09-30");
  });

  it("initializes once and keeps later edits", () => {
    const first = loadOrInitializeIngredients(
      window.localStorage,
      seed,
      "2026-09-29",
    );
    expect(first).toHaveLength(2);

    const edited = first.map((item) =>
      item.id === "seed-chicken"
        ? { ...item, name: "Chicken thighs" }
        : item,
    );
    writeStoredIngredients(window.localStorage, edited);

    const second = loadOrInitializeIngredients(
      window.localStorage,
      seed,
      "2026-10-01",
    );
    expect(second.find((item) => item.id === "seed-chicken")?.name).toBe(
      "Chicken thighs",
    );
    expect(readStoredIngredients(window.localStorage)).not.toBeNull();
    expect(window.localStorage.getItem(INGREDIENTS_STORAGE_KEY)).toContain(
      "Chicken thighs",
    );
  });

  it("returns null for invalid stored JSON", () => {
    window.localStorage.setItem(INGREDIENTS_STORAGE_KEY, "{not-json");
    expect(readStoredIngredients(window.localStorage)).toBeNull();
  });

  it("creates fallback ids when crypto is unavailable", () => {
    vi.stubGlobal("crypto", undefined);
    expect(createIngredientId()).toMatch(/^ingredient-/);
  });
});
