import { describe, expect, it } from "vitest";
import {
  isCookable,
  isInReview,
  isUseSoon,
  partitionIngredients,
} from "@/lib/ingredient-groups";
import type { Ingredient } from "@/lib/types";

const today = "2026-09-29";

function ingredient(
  overrides: Partial<Ingredient> & Pick<Ingredient, "id" | "name" | "reminderDate">,
): Ingredient {
  return { status: "available", ...overrides };
}

describe("ingredient groups", () => {
  it("separates review, use soon, and other ingredients", () => {
    const items = [
      ingredient({ id: "1", name: "Spinach", reminderDate: "2026-09-28" }),
      ingredient({ id: "2", name: "Chicken", reminderDate: "2026-09-30" }),
      ingredient({ id: "3", name: "Rice", reminderDate: "2026-10-03" }),
    ];

    expect(isInReview(items[0], today)).toBe(true);
    expect(isUseSoon(items[1], today)).toBe(true);
    expect(isCookable(items[0], today)).toBe(false);
    expect(isCookable(items[1], today)).toBe(true);

    const groups = partitionIngredients(items, today);
    expect(groups.review.map((item) => item.name)).toEqual(["Spinach"]);
    expect(groups.useSoon.map((item) => item.name)).toEqual(["Chicken"]);
    expect(groups.other.map((item) => item.name)).toEqual(["Rice"]);
  });

  it("ignores used ingredients in every group", () => {
    const usedChicken = ingredient({
      id: "2",
      name: "Chicken",
      reminderDate: "2026-09-30",
      status: "used",
    });
    expect(isUseSoon(usedChicken, today)).toBe(false);
    const groups = partitionIngredients(
      [
        usedChicken,
        ingredient({ id: "3", name: "Rice", reminderDate: "2026-10-03" }),
      ],
      today,
    );
    expect(groups.useSoon).toHaveLength(0);
    expect(groups.other.map((item) => item.name)).toEqual(["Rice"]);
  });
});
