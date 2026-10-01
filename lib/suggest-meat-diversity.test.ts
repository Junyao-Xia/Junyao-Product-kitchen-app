import { describe, expect, it } from "vitest";
import {
  applyMeatDiversity,
  buildMeatDiversityPartialMessage,
  buildMeatDiversityPlan,
  countMeatsInIngredientNames,
  meatDiversityPromptLines,
  meetsMeatDiversityRules,
  prioritizeMeatsForSuggest,
  primaryMeatForSuggestion,
  stepsIntroduceExtraMeats,
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
    expect(result.suggestions.length).toBeGreaterThanOrEqual(2);
    const primaries = result.suggestions.map((item) =>
      primaryMeatForSuggestion(item, ["Beef", "Chicken", "Duck", "Rice"]),
    );
    expect(new Set(primaries).size).toBeGreaterThanOrEqual(2);
  });

  it("builds prompt lines for each meat-count tier", () => {
    expect(
      meatDiversityPromptLines(
        buildMeatDiversityPlan(["Beef", "Chicken", "Duck"], []),
      ).some((line) => line.includes("different primary meat")),
    ).toBe(true);
    expect(
      meatDiversityPromptLines(
        buildMeatDiversityPlan(["Chicken", "Pork", "Rice"], []),
      ).some((line) => line.includes("both cookable meats")),
    ).toBe(true);
    expect(
      meatDiversityPromptLines(
        buildMeatDiversityPlan(["Chicken", "Rice"], []),
      ).some((line) => line.includes("vary dish style")),
    ).toBe(true);
    expect(meatDiversityPromptLines(buildMeatDiversityPlan(["Rice"], []))).toEqual(
      [],
    );
  });

  it("formats partial-result copy for fewer than three meals", () => {
    const plan = buildMeatDiversityPlan(["Beef", "Chicken", "Duck"], []);
    expect(buildMeatDiversityPartialMessage(2, plan)).toContain("Showing 2");
  });

  it("detects extra meats mentioned only in steps", () => {
    expect(
      stepsIntroduceExtraMeats(
        ["Pan-fry beef and chicken together."],
        ["Beef"],
        ["Beef", "Chicken"],
      ),
    ).toBe(true);
  });

  it("falls back to raw suggestions when every dish fails the single-meat rule", () => {
    const plan = buildMeatDiversityPlan(["Chicken", "Pork"], []);
    const result = applyMeatDiversity(
      [
        {
          id: "",
          name: "Combo",
          minutes: 18,
          ingredientNames: ["Chicken", "Pork"],
          steps: ["Cook chicken and pork.", "Serve."],
        },
      ],
      plan,
      ["Chicken", "Pork"],
    );
    expect(result.suggestions).toHaveLength(1);
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
