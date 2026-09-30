import { describe, expect, it } from "vitest";
import {
  hasFieldErrors,
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

  it("requires keep dates to be today or later", () => {
    expect(
      validateKeepDate("2026-09-28", "2026-09-29").reminderDate,
    ).toBeTruthy();
    expect(
      hasFieldErrors(validateKeepDate("2026-09-29", "2026-09-29")),
    ).toBe(false);
  });
});
