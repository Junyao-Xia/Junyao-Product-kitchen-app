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

  it("retries when the first model response fails to parse and returns meals from the second", async () => {
    vi.stubEnv("OPENAI_API_KEY", "test-key");
    const diverse = {
      suggestions: [
        {
          name: "Beef bowl",
          minutes: 18,
          ingredientNames: ["Beef", "Rice"],
          steps: ["Cook rice.", "Pan-fry beef."],
        },
        {
          name: "Pork stir fry",
          minutes: 16,
          ingredientNames: ["Pork", "Rice"],
          steps: ["Stir-fry pork.", "Serve over rice."],
        },
        {
          name: "Duck plate",
          minutes: 15,
          ingredientNames: ["Duck", "Rice"],
          steps: ["Pan-sear duck.", "Serve with rice."],
        },
      ],
    };
    const chatCompletion = vi
      .fn()
      .mockResolvedValueOnce("not json")
      .mockResolvedValueOnce(JSON.stringify(diverse));

    const result = await suggestDinnersWithOpenAI(
      [
        {
          id: "1",
          name: "Chicken",
          reminderDate: "2026-10-02",
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
          name: "Pork",
          reminderDate: "2026-10-02",
          status: "available",
        },
        {
          id: "4",
          name: "Duck",
          reminderDate: "2026-10-03",
          status: "available",
        },
        {
          id: "5",
          name: "Rice",
          reminderDate: "2026-10-04",
          status: "available",
        },
      ],
      "2026-10-01",
      chatCompletion,
    );

    expect(chatCompletion).toHaveBeenCalledTimes(2);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.suggestions.length).toBeGreaterThan(0);
    }
    vi.unstubAllEnvs();
  });

  it("uses a third model attempt when the first two return no valid suggestions", async () => {
    vi.stubEnv("OPENAI_API_KEY", "test-key");
    const valid = {
      suggestions: [
        {
          name: "Pork fried rice",
          minutes: 18,
          ingredientNames: ["Pork", "Rice", "Eggs"],
          steps: ["Scramble eggs.", "Stir-fry pork and rice with eggs."],
        },
      ],
    };
    const chatCompletion = vi
      .fn()
      .mockResolvedValueOnce("not json")
      .mockResolvedValueOnce("{ broken")
      .mockResolvedValueOnce(JSON.stringify(valid));

    const result = await suggestDinnersWithOpenAI(
      [
        {
          id: "1",
          name: "Pork",
          reminderDate: "2026-10-01",
          status: "available",
        },
        {
          id: "2",
          name: "Rice",
          reminderDate: "2026-10-02",
          status: "available",
        },
        {
          id: "3",
          name: "Eggs",
          reminderDate: "2026-10-03",
          status: "available",
        },
      ],
      "2026-10-01",
      chatCompletion,
    );

    expect(chatCompletion).toHaveBeenCalledTimes(3);
    expect(result.ok).toBe(true);
    vi.unstubAllEnvs();
  });

  it("retries when every first-pass suggestion fails validation and merges valid second-pass meals", async () => {
    vi.stubEnv("OPENAI_API_KEY", "test-key");
    const invalidMultiMeat = {
      suggestions: [
        {
          name: "Surf and turf",
          minutes: 18,
          ingredientNames: ["Beef", "Chicken", "Rice"],
          steps: ["Cook beef and chicken.", "Serve over rice."],
        },
      ],
    };
    const validBeef = {
      suggestions: [
        {
          name: "Beef rice bowl",
          minutes: 15,
          ingredientNames: ["Beef", "Rice"],
          steps: ["Cook rice.", "Pan-fry beef strips."],
        },
      ],
    };
    const chatCompletion = vi
      .fn()
      .mockResolvedValueOnce(JSON.stringify(invalidMultiMeat))
      .mockResolvedValueOnce(JSON.stringify(validBeef));

    const result = await suggestDinnersWithOpenAI(
      [
        {
          id: "1",
          name: "Beef",
          reminderDate: "2026-10-01",
          status: "available",
        },
        {
          id: "2",
          name: "Chicken",
          reminderDate: "2026-10-02",
          status: "available",
        },
        {
          id: "3",
          name: "Rice",
          reminderDate: "2026-10-03",
          status: "available",
        },
      ],
      "2026-10-01",
      chatCompletion,
    );

    expect(chatCompletion).toHaveBeenCalledTimes(2);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.suggestions[0]?.name).toBe("Beef rice bowl");
    }
    vi.unstubAllEnvs();
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
