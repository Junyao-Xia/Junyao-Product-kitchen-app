import { describe, expect, it } from "vitest";
import { buildIngredientFingerprint } from "@/lib/ingredient-fingerprint";
import type { Ingredient } from "@/lib/types";

describe("ingredient fingerprint", () => {
  it("changes when an ingredient is edited", () => {
    const base: Ingredient[] = [
      {
        id: "a",
        name: "Chicken",
        reminderDate: "2026-09-30",
        status: "available",
      },
    ];
    const before = buildIngredientFingerprint(base);
    const after = buildIngredientFingerprint([
      { ...base[0], status: "used" },
    ]);
    expect(before).not.toBe(after);
  });
});
