import { describe, expect, it, vi } from "vitest";
import {
  assignSuggestionIds,
  buildSuggestUserPrompt,
  findCookableMentionsInText,
  isSuggestRequestFailure,
  parseSuggestResponse,
  resolveCanonicalCookableName,
  stepsReferenceOnlyListedIngredients,
  suggestDinnersWithOpenAI,
  SUGGEST_NO_COOKABLE_MESSAGE,
  SUGGEST_USER_ERROR,
  validateSuggestItem,
  validateSuggestRequest,
} from "@/lib/suggest-dinners";

const cookable = ["Chicken", "Rice", "Spinach"];

describe("suggest-dinners", () => {
  it("builds a prompt with cookable and use-soon lists", () => {
    const prompt = buildSuggestUserPrompt(cookable, ["Spinach"]);
    expect(prompt).toContain("Chicken, Rice, Spinach");
    expect(prompt).toContain("Use soon (prioritize): Spinach");
  });

  it("parses valid JSON suggestions", () => {
    const raw = JSON.stringify({
      suggestions: [
        {
          name: "Quick chicken bowl",
          minutes: 18,
          ingredientNames: ["Chicken", "Rice"],
          steps: ["Cook rice.", "Pan-fry chicken and serve over rice."],
        },
      ],
      unableReason: null,
    });
    const result = parseSuggestResponse(raw, cookable);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.suggestions).toHaveLength(1);
      expect(result.suggestions[0].ingredientNames).toEqual(["Chicken", "Rice"]);
    }
  });

  it("rejects suggestions with unlisted ingredients", () => {
    const raw = JSON.stringify({
      suggestions: [
        {
          name: "Pasta night",
          minutes: 15,
          ingredientNames: ["Pasta", "Chicken"],
          steps: ["Boil pasta.", "Add chicken."],
        },
      ],
    });
    const result = parseSuggestResponse(raw, cookable);
    expect(result.ok).toBe(false);
  });

  it("rejects suggestions over the time limit", () => {
    const item = validateSuggestItem(
      {
        name: "Slow stew",
        minutes: 25,
        ingredientNames: ["Chicken"],
        steps: ["Simmer chicken.", "Serve."],
      },
      cookable,
    );
    expect(item).toBeNull();
  });

  it("rejects steps that mention cookable ingredients not in the dish", () => {
    const allowed = stepsReferenceOnlyListedIngredients(
      ["Cook rice.", "Serve with spinach on the side."],
      ["Rice"],
      cookable,
    );
    expect(allowed).toBe(false);
  });

  it("allows assumed staples in steps without listing them on the fridge", () => {
    const allowed = stepsReferenceOnlyListedIngredients(
      ["Season with salt and pepper.", "Cook chicken in oil."],
      ["Chicken"],
      cookable,
    );
    expect(allowed).toBe(true);
  });

  it("rejects steps that mention pantry items not on the list", () => {
    const allowed = stepsReferenceOnlyListedIngredients(
      ["Add soy sauce.", "Cook chicken."],
      ["Chicken"],
      cookable,
    );
    expect(allowed).toBe(false);
  });

  it("returns unableReason when no suggestion validates", () => {
    const raw = JSON.stringify({
      suggestions: [],
      unableReason: "Need more than rice alone.",
    });
    const result = parseSuggestResponse(raw, cookable);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("Need more than rice alone.");
    }
  });

  it("validates suggest request bodies", () => {
    expect(isSuggestRequestFailure(validateSuggestRequest(null))).toBe(true);
    expect(isSuggestRequestFailure(validateSuggestRequest({ today: "", ingredients: [] }))).toBe(
      true,
    );
    expect(
      isSuggestRequestFailure(
        validateSuggestRequest({ today: "2026-09-29", ingredients: "bad" }),
      ),
    ).toBe(true);
    expect(validateSuggestRequest({ today: "2026-09-29", ingredients: [] })).toEqual({
      today: "2026-09-29",
      ingredients: [],
    });
  });

  it("keeps valid snapshot rows and skips malformed ones", () => {
    const result = validateSuggestRequest({
      today: "2026-09-29",
      ingredients: [
        {
          id: "1",
          name: "Rice",
          reminderDate: "2026-10-01",
          status: "available",
        },
        {
          id: "",
          name: "Bad",
          reminderDate: "2026-10-01",
          status: "available",
        },
        null,
      ],
    });
    if (isSuggestRequestFailure(result)) {
      throw new Error("expected valid body");
    }
    expect(result.ingredients).toHaveLength(1);
  });

  it("parses invalid JSON and malformed payloads", () => {
    expect(parseSuggestResponse("not-json", cookable).ok).toBe(false);
    expect(
      parseSuggestResponse(JSON.stringify({ suggestions: "nope" }), cookable),
    ).toEqual({
      ok: false,
      error: expect.any(String),
    });
  });

  it("rejects safety language in suggestions", () => {
    const item = validateSuggestItem(
      {
        name: "Bad copy",
        minutes: 15,
        ingredientNames: ["Chicken"],
        steps: ["The chicken is safe to eat.", "Cook it."],
      },
      cookable,
    );
    expect(item).toBeNull();
  });

  it("accepts assumed staples in ingredient lists without a fridge entry", () => {
    const item = validateSuggestItem(
      {
        name: "Pan chicken",
        minutes: 15,
        ingredientNames: ["Chicken", "Salt", "Cooking oil"],
        steps: ["Season chicken with salt.", "Pan-fry in oil."],
      },
      cookable,
    );
    expect(item?.ingredientNames).toEqual(
      expect.arrayContaining(["Chicken", "Salt", "Cooking oil"]),
    );
  });

  it("resolves canonical cookable names case-insensitively", () => {
    expect(resolveCanonicalCookableName(" chicken ", cookable)).toBe("Chicken");
  });

  it("finds cookable mentions in step text", () => {
    expect(findCookableMentionsInText("Cook rice and chicken", cookable)).toEqual(
      expect.arrayContaining(["Rice", "Chicken"]),
    );
  });

  it("assigns stable server-side ids before client uuid", () => {
    const assigned = assignSuggestionIds([
      {
        id: "",
        name: "Rice bowl",
        minutes: 20,
        ingredientNames: ["Rice"],
        steps: ["Cook rice.", "Serve."],
      },
    ]);
    expect(assigned[0].id).toMatch(/^ai-0-rice-bowl$/);
  });

  it("returns no cookable message when every item is in review", async () => {
    const result = await suggestDinnersWithOpenAI(
      [
        {
          id: "1",
          name: "Spinach",
          reminderDate: "2026-09-27",
          status: "available",
        },
      ],
      "2026-09-29",
      vi.fn(),
    );
    expect(result).toEqual({ ok: false, error: SUGGEST_NO_COOKABLE_MESSAGE });
  });

  it("returns an error when the API key is missing", async () => {
    vi.stubEnv("OPENAI_API_KEY", "");
    const result = await suggestDinnersWithOpenAI(
      [
        {
          id: "1",
          name: "Rice",
          reminderDate: "2026-10-01",
          status: "available",
        },
      ],
      "2026-09-29",
    );
    expect(result).toEqual({ ok: false, error: SUGGEST_USER_ERROR });
    vi.unstubAllEnvs();
  });

  it("returns an error when chat completion throws", async () => {
    vi.stubEnv("OPENAI_API_KEY", "test-key");
    const result = await suggestDinnersWithOpenAI(
      [
        {
          id: "1",
          name: "Rice",
          reminderDate: "2026-10-01",
          status: "available",
        },
      ],
      "2026-09-29",
      vi.fn().mockRejectedValue(new Error("network")),
    );
    expect(result).toEqual({ ok: false, error: SUGGEST_USER_ERROR });
    vi.unstubAllEnvs();
  });

  it("uses injected chat completion without network", async () => {
    const chatCompletion = vi.fn().mockResolvedValue(
      JSON.stringify({
        suggestions: [
          {
            name: "Spinach rice",
            minutes: 20,
            ingredientNames: ["Rice", "Spinach"],
            steps: ["Cook rice.", "Wilt spinach and mix in."],
          },
        ],
      }),
    );
    vi.stubEnv("OPENAI_API_KEY", "test-key");

    const result = await suggestDinnersWithOpenAI(
      [
        {
          id: "1",
          name: "Rice",
          reminderDate: "2026-10-01",
          status: "available",
        },
        {
          id: "2",
          name: "Spinach",
          reminderDate: "2026-09-29",
          status: "available",
        },
      ],
      "2026-09-29",
      chatCompletion,
    );

    expect(result.ok).toBe(true);
    expect(chatCompletion).toHaveBeenCalledOnce();
    vi.unstubAllEnvs();
  });

  it("builds prompt when there are no use-soon ingredients", () => {
    const prompt = buildSuggestUserPrompt(["Rice"], []);
    expect(prompt).toContain("Use soon: none");
  });

  it("skips invalid entries but keeps valid suggestions in the array", () => {
    const raw = JSON.stringify({
      suggestions: [
        null,
        { name: "Incomplete" },
        {
          name: "Egg rice",
          minutes: 20,
          ingredientNames: ["Eggs", "Rice"],
          steps: ["Scramble eggs.", "Serve over rice."],
        },
      ],
    });
    const result = parseSuggestResponse(raw, ["Eggs", "Rice"]);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.suggestions).toHaveLength(1);
    }
  });

  it("rejects items missing required fields", () => {
    expect(
      validateSuggestItem(
        {
          name: "",
          minutes: 10,
          ingredientNames: ["Rice"],
          steps: ["Cook rice.", "Eat."],
        },
        ["Rice"],
      ),
    ).toBeNull();
    expect(
      validateSuggestItem(
        {
          name: "Rice only",
          minutes: 10,
          ingredientNames: [],
          steps: ["Cook rice.", "Eat."],
        },
        ["Rice"],
      ),
    ).toBeNull();
    expect(
      validateSuggestItem(
        {
          name: "Rice only",
          minutes: 10,
          ingredientNames: ["Rice"],
          steps: ["Only one step"],
        },
        ["Rice"],
      ),
    ).toBeNull();
  });

  it("propagates parse failure after chat completion returns unusable JSON", async () => {
    vi.stubEnv("OPENAI_API_KEY", "test-key");
    const result = await suggestDinnersWithOpenAI(
      [
        {
          id: "1",
          name: "Rice",
          reminderDate: "2026-10-01",
          status: "available",
        },
      ],
      "2026-09-29",
      vi.fn().mockResolvedValue("{not valid json"),
    );
    expect(result.ok).toBe(false);
    vi.unstubAllEnvs();
  });

  it("accepts minutes provided as a numeric string", () => {
    const item = validateSuggestItem(
      {
        name: "Rice plate",
        minutes: "19",
        ingredientNames: ["Rice"],
        steps: ["Cook rice.", "Serve hot."],
      },
      ["Rice"],
    );
    expect(item?.minutes).toBe(19);
  });
});
