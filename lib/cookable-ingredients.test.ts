import { describe, expect, it } from "vitest";
import { listCookableIngredientNames } from "@/lib/cookable-ingredients";
import type { Ingredient } from "@/lib/types";

describe("cookable ingredients", () => {
  it("lists only available ingredients that are not in review", () => {
    const today = "2026-09-29";
    const ingredients: Ingredient[] = [
      {
        id: "1",
        name: "Spinach",
        reminderDate: "2026-09-28",
        status: "available",
      },
      {
        id: "2",
        name: "Chicken",
        reminderDate: "2026-09-30",
        status: "available",
      },
      {
        id: "3",
        name: "Rice",
        reminderDate: "2026-10-03",
        status: "used",
      },
    ];

    expect(listCookableIngredientNames(ingredients, today)).toEqual([
      "Chicken",
    ]);
  });
});
