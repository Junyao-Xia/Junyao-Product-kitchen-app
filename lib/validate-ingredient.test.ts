import type { Ingredient } from "@/lib/types";
import { describe, expect, it } from "vitest";
import {
  DUPLICATE_AVAILABLE_INGREDIENT_MESSAGE,
  hasFieldErrors,
  isAvailableIngredientNameOnList,
  validateAddIngredient,
  validateIngredientFields,
  validateKeepDate,
} from "@/lib/validate-ingredient";

describe("validate ingredient", () => {
  it("rejects blank fields", () => {
    const errors = validateIngredientFields("  ", "");
    expect(errors.name).toBeTruthy();
    expect(errors.reminderDate).toBeTruthy();
    expect(hasFieldErrors(errors)).toBe(true);
  });

  it("accepts valid add fields", () => {
    const errors = validateIngredientFields("Chicken", "2026-09-30");
    expect(hasFieldErrors(errors)).toBe(false);
  });

  it("rejects malformed reminder dates", () => {
    expect(validateIngredientFields("Chicken", "2026-13-01").reminderDate).toBe(
      "Use a valid date.",
    );
  });

  it("blocks duplicate names only among available ingredients", () => {
    const list: Ingredient[] = [
      {
        id: "1",
        name: "Chicken",
        reminderDate: "2026-09-30",
        status: "available",
      },
      {
        id: "2",
        name: "Beef",
        reminderDate: "2026-10-01",
        status: "used",
      },
    ];
    expect(isAvailableIngredientNameOnList(list, "chicken")).toBe(true);
    expect(isAvailableIngredientNameOnList(list, "Beef")).toBe(false);
    expect(validateAddIngredient("Chicken", "2026-10-05", list).name).toBe(
      DUPLICATE_AVAILABLE_INGREDIENT_MESSAGE,
    );
    expect(hasFieldErrors(validateAddIngredient("Beef", "2026-10-05", list))).toBe(
      false,
    );
  });

  it("requires keep dates to be today or later", () => {
    expect(
      validateKeepDate("2026-09-28", "2026-09-29").reminderDate,
    ).toBeTruthy();
    expect(
      hasFieldErrors(validateKeepDate("2026-09-29", "2026-09-29")),
    ).toBe(false);
  });
});
