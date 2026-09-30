import { describe, expect, it } from "vitest";
import {
  findIngredientByName,
  isDinnerEligible,
  rankSuggestedDinners,
} from "@/lib/dinners";
import type { Dinner, Ingredient } from "@/lib/types";

const today = "2026-09-29";

const chickenRice: Dinner = {
  id: "d1",
  name: "Chicken and rice",
  minutes: 20,
  ingredientNames: ["Chicken", "Rice"],
  steps: ["Cook rice.", "Cook chicken."],
};

const spinachEggs: Dinner = {
  id: "d2",
  name: "Spinach and eggs",
  minutes: 15,
  ingredientNames: ["Spinach", "Eggs"],
  steps: ["Cook spinach.", "Cook eggs."],
};

describe("dinners", () => {
  it("matches ingredient names without case sensitivity", () => {
    const ingredients: Ingredient[] = [
      {
        id: "1",
        name: "chicken",
        reminderDate: "2026-09-30",
        status: "available",
      },
    ];
    expect(findIngredientByName(ingredients, "Chicken")?.name).toBe("chicken");
  });

  it("excludes dinners that need review ingredients", () => {
    const ingredients: Ingredient[] = [
      {
        id: "1",
        name: "Spinach",
        reminderDate: "2026-09-28",
        status: "available",
      },
      {
        id: "2",
        name: "Eggs",
        reminderDate: "2026-10-04",
        status: "available",
      },
      {
        id: "3",
        name: "Chicken",
        reminderDate: "2026-09-30",
        status: "available",
      },
      {
        id: "4",
        name: "Rice",
        reminderDate: "2026-10-03",
        status: "available",
      },
    ];

    expect(isDinnerEligible(spinachEggs, ingredients, today)).toBe(false);
    expect(isDinnerEligible(chickenRice, ingredients, today)).toBe(true);

    const ranked = rankSuggestedDinners(
      [chickenRice, spinachEggs],
      ingredients,
      today,
    );
    expect(ranked.map((dinner) => dinner.id)).toEqual(["d1"]);
  });

  it("ranks dinners by the earliest reminder date they use", () => {
    const ingredients: Ingredient[] = [
      {
        id: "1",
        name: "Chicken",
        reminderDate: "2026-09-30",
        status: "available",
      },
      {
        id: "2",
        name: "Rice",
        reminderDate: "2026-10-03",
        status: "available",
      },
      {
        id: "3",
        name: "Onion",
        reminderDate: "2026-10-01",
        status: "available",
      },
      {
        id: "4",
        name: "Tortillas",
        reminderDate: "2026-10-05",
        status: "available",
      },
    ];

    const wrap: Dinner = {
      id: "wrap",
      name: "Wrap",
      minutes: 20,
      ingredientNames: ["Chicken", "Tortillas", "Onion"],
      steps: ["Cook.", "Wrap."],
    };

    const ranked = rankSuggestedDinners(
      [wrap, chickenRice],
      ingredients,
      today,
    );
    expect(ranked[0].id).toBe("d1");
  });

  it("returns at most three dinners and skips meals over twenty minutes", () => {
    const ingredients: Ingredient[] = [
      {
        id: "1",
        name: "Eggs",
        reminderDate: "2026-10-04",
        status: "available",
      },
    ];
    const quick: Dinner = {
      id: "quick",
      name: "Quick eggs",
      minutes: 20,
      ingredientNames: ["Eggs"],
      steps: ["Scramble eggs."],
    };
    const slow: Dinner = {
      id: "slow",
      name: "Slow eggs",
      minutes: 25,
      ingredientNames: ["Eggs"],
      steps: ["Wait."],
    };
    const many = Array.from({ length: 5 }, (_, index) => ({
      ...quick,
      id: `q${index}`,
      name: `Quick eggs ${index}`,
    }));

    expect(isDinnerEligible(slow, ingredients, today)).toBe(false);
    expect(rankSuggestedDinners(many, ingredients, today)).toHaveLength(3);
  });

  it("ranks dated dinners ahead of meals with no ingredient dates", () => {
    const ingredients: Ingredient[] = [
      {
        id: "1",
        name: "Chicken",
        reminderDate: "2026-09-30",
        status: "available",
      },
      {
        id: "2",
        name: "Rice",
        reminderDate: "2026-10-03",
        status: "available",
      },
    ];
    const emptyList: Dinner = {
      id: "empty",
      name: "Anything",
      minutes: 20,
      ingredientNames: [],
      steps: ["Step one.", "Step two."],
    };

    const ranked = rankSuggestedDinners(
      [emptyList, chickenRice],
      ingredients,
      today,
    );
    expect(ranked[0].id).toBe("d1");
  });

  it("returns null priority when no ingredients match", () => {
    const dinner: Dinner = {
      id: "solo",
      name: "Solo",
      minutes: 20,
      ingredientNames: ["Missing"],
      steps: ["Step one.", "Step two."],
    };
    expect(isDinnerEligible(dinner, [], today)).toBe(false);
  });
});
