import { describe, expect, it } from "vitest";
import {
  applyMeatDiversity,
  buildMeatDiversityPlan,
  countMeatsInIngredientNames,
  meetsMeatDiversityRules,
  prioritizeMeatsForSuggest,
  primaryMeatForSuggestion,
} from "@/lib/suggest-meat-diversity";
import type { AiDinnerSuggestion } from "@/lib/types";

function meal(
  name: string,
  meat: string,
  extra: string[] = ["Rice"],
): AiDinnerSuggestion {
  return {
    id: "",
    name,
    minutes: 18,
    ingredientNames: [meat, ...extra],
    steps: [`Cook ${meat.toLowerCase()} with rice.`, "Serve hot."],
  };
}

describe("suggest meat diversity", () => {
  it("prioritizes use-soon meats in the focus list", () => {
    expect(
      prioritizeMeatsForSuggest(
        ["Beef", "Chicken", "Duck", "Pork"],
        ["Duck", "Spinach"],
      ),
    ).toEqual(["Duck", "Beef", "Chicken"]);
  });

  it("rejects combined meats in one dish", () => {
    expect(countMeatsInIngredientNames(["Chicken", "Beef", "Rice"])).toBe(2);
  });

  it("requires three different primary meats when three are cookable", () => {
    const plan = buildMeatDiversityPlan(
      ["Beef", "Chicken", "Duck", "Rice"],
      ["Beef"],
    );
    const repeated = [
      meal("Beef bowl", "Beef"),
      meal("Beef stir fry", "Beef"),
      meal("Beef plate", "Beef"),
    ];
    expect(meetsMeatDiversityRules(repeated, plan, plan.focusMeats.concat(["Rice"]))).toBe(
      false,
    );

    const diverse = [
      meal("Beef bowl", "Beef"),
      meal("Chicken rice", "Chicken"),
      meal("Duck stir fry", "Duck"),
    ];
    expect(
      meetsMeatDiversityRules(
        diverse,
        plan,
        ["Beef", "Chicken", "Duck", "Rice"],
      ),
    ).toBe(true);
  });

  it("selects a diverse subset and flags partial results", () => {
    const plan = buildMeatDiversityPlan(
      ["Beef", "Chicken", "Duck", "Rice"],
      [],
    );
    const suggestions = [
      meal("Beef bowl", "Beef"),
      meal("Beef tacos", "Beef"),
      meal("Chicken rice", "Chicken"),
      meal("Duck noodles", "Duck"),
    ];
    const result = applyMeatDiversity(
      suggestions,
      plan,
      ["Beef", "Chicken", "Duck", "Rice"],
    );
    expect(result.needsRetry).toBe(false);
    expect(result.suggestions).toHaveLength(3);
    const primaries = result.suggestions.map((item) =>
      primaryMeatForSuggestion(item, ["Beef", "Chicken", "Duck", "Rice"]),
    );
    expect(new Set(primaries).size).toBe(3);
  });

  it("drops multi-meat dishes and keeps both meats across the set", () => {
    const plan = buildMeatDiversityPlan(["Chicken", "Pork", "Rice"], []);
    const suggestions = [
      meal("Chicken rice", "Chicken"),
      meal("Chicken and pork", "Chicken", ["Pork", "Rice"]),
      meal("Pork bowl", "Pork"),
    ];
    const result = applyMeatDiversity(
      suggestions,
      plan,
      ["Chicken", "Pork", "Rice"],
    );
    expect(
      result.suggestions.every(
        (item) => countMeatsInIngredientNames(item.ingredientNames) <= 1,
      ),
    ).toBe(true);
    const primaries = result.suggestions.map((item) =>
      primaryMeatForSuggestion(item, ["Chicken", "Pork", "Rice"]),
    );
    expect(primaries).toContain("Chicken");
    expect(primaries).toContain("Pork");
  });
});
