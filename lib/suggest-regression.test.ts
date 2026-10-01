import { describe, expect, it, vi } from "vitest";
import { applyMeatDiversity, buildMeatDiversityPlan } from "@/lib/suggest-meat-diversity";
import {
  parseSuggestResponse,
  suggestDinnersWithOpenAI,
  SUGGEST_GENERATION_FAILED,
  SUGGEST_USER_ERROR,
} from "@/lib/suggest-dinners";
import type { AiDinnerSuggestion } from "@/lib/types";

function chickenMeal(name: string): AiDinnerSuggestion {
  return {
    id: "",
    name,
    minutes: 18,
    ingredientNames: ["Chicken", "Rice"],
    steps: ["Cook rice.", "Pan-fry chicken."],
  };
}

describe("suggest regressions (spec 004)", () => {
  it("does not use the empty-list message when JSON parsing fails", () => {
    const result = parseSuggestResponse("not json at all", ["Rice"]);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe(SUGGEST_GENERATION_FAILED);
      expect(result.error).toBe(SUGGEST_USER_ERROR);
    }
  });

  it("keeps valid meals when diversity prefers a retry", () => {
    const plan = buildMeatDiversityPlan(
      ["Beef", "Chicken", "Duck", "Rice"],
      ["Beef"],
    );
    const result = applyMeatDiversity(
      [
        chickenMeal("Chicken bowl"),
        chickenMeal("Chicken stir fry"),
        chickenMeal("Chicken plate"),
      ],
      plan,
      ["Beef", "Chicken", "Duck", "Rice"],
    );
    expect(result.suggestions.length).toBeGreaterThan(0);
    expect(result.needsRetry).toBe(true);
  });

  it("returns first-pass meals when the corrective retry fails to parse", async () => {
    vi.stubEnv("OPENAI_API_KEY", "test-key");
    const tripleChicken = {
      suggestions: [
        {
          name: "Chicken bowl",
          minutes: 18,
          ingredientNames: ["Chicken", "Rice"],
          steps: ["Cook rice.", "Pan-fry chicken."],
        },
        {
          name: "Chicken stir fry",
          minutes: 16,
          ingredientNames: ["Chicken", "Rice"],
          steps: ["Stir-fry chicken.", "Add rice."],
        },
        {
          name: "Chicken plate",
          minutes: 15,
          ingredientNames: ["Chicken", "Rice"],
          steps: ["Cook chicken.", "Serve over rice."],
        },
      ],
    };
    const chatCompletion = vi
      .fn()
      .mockResolvedValueOnce(JSON.stringify(tripleChicken))
      .mockResolvedValueOnce("```json\n{ broken");

    const result = await suggestDinnersWithOpenAI(
      [
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
          status: "available",
        },
        {
          id: "3",
          name: "Duck",
          reminderDate: "2026-10-02",
          status: "available",
        },
        {
          id: "4",
          name: "Rice",
          reminderDate: "2026-10-03",
          status: "available",
        },
      ],
      "2026-09-29",
      chatCompletion,
    );

    expect(chatCompletion).toHaveBeenCalledTimes(2);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.suggestions.length).toBeGreaterThan(0);
    }
    vi.unstubAllEnvs();
  });
});
