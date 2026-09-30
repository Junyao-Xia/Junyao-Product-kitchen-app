import { describe, expect, it, vi } from "vitest";
import {
  allowedSimplifyIngredientNames,
  buildSimplifyUserPrompt,
  parseSimplifyResponse,
  simplifyDinnerWithOpenAI,
  isSimplifyRequestFailure,
  validateSimplifyRequest,
} from "@/lib/simplify-dinner";
import type { Dinner } from "@/lib/types";

const dinner: Dinner = {
  id: "dinner-chicken-rice",
  name: "Chicken and rice",
  minutes: 20,
  ingredientNames: ["Chicken", "Rice"],
  steps: ["Cook rice.", "Cook chicken."],
};

describe("simplify-dinner", () => {
  it("builds a prompt with dinner name, time, and cookable ingredients", () => {
    const prompt = buildSimplifyUserPrompt(dinner, ["Chicken", "Rice"]);
    expect(prompt).toContain("Chicken and rice");
    expect(prompt).toContain("20 minutes");
    expect(prompt).toContain("Chicken, Rice");
    expect(prompt).toContain("Cook rice.");
    expect(prompt).toContain("Assumed staples");
  });

  it("parses numbered simplify lines", () => {
    const allowed = allowedSimplifyIngredientNames(dinner, ["Chicken", "Rice"]);
    const result = parseSimplifyResponse(
      "1. Start rice.\n2. Cook chicken quickly.\n3. Serve together.",
      allowed,
      ["Chicken", "Rice"],
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.lines).toHaveLength(3);
      expect(result.lines[0]).toBe("Start rice.");
    }
  });

  it("rejects safety language in the response", () => {
    const allowed = allowedSimplifyIngredientNames(dinner, ["Chicken", "Rice"]);
    const result = parseSimplifyResponse(
      "1. The chicken is safe to eat.\n2. Cook it.",
      allowed,
      ["Chicken", "Rice"],
    );
    expect(result.ok).toBe(false);
  });

  it("allows water in simplified steps when cooking rice", () => {
    const allowed = allowedSimplifyIngredientNames(dinner, ["Chicken", "Rice"]);
    const result = parseSimplifyResponse(
      "1. Simmer rice in water for 12 minutes.\n2. Pan-fry chicken with salt and oil.\n3. Serve.",
      allowed,
      ["Chicken", "Rice"],
    );
    expect(result.ok).toBe(true);
  });

  it("allows assumed staples in simplified steps", () => {
    const allowed = allowedSimplifyIngredientNames(dinner, ["Chicken", "Rice"]);
    const result = parseSimplifyResponse(
      "1. Season chicken with salt and pepper.\n2. Cook rice in a little oil.",
      allowed,
      ["Chicken", "Rice"],
    );
    expect(result.ok).toBe(true);
  });

  it("rejects simplify steps that mention unlisted seasonings", () => {
    const allowed = allowedSimplifyIngredientNames(dinner, ["Chicken", "Rice"]);
    const result = parseSimplifyResponse(
      "1. Add soy sauce.\n2. Cook chicken.",
      allowed,
      ["Chicken", "Rice"],
    );
    expect(result.ok).toBe(false);
  });

  it("rejects overlong responses", () => {
    const words = Array.from({ length: 130 }, (_, index) => `word${index}`).join(
      " ",
    );
    const allowed = allowedSimplifyIngredientNames(dinner, ["Chicken", "Rice"]);
    const result = parseSimplifyResponse(`1. ${words}\n2. Done.`, allowed, [
      "Chicken",
      "Rice",
    ]);
    expect(result.ok).toBe(false);
  });

  it("validates seeded request bodies", () => {
    expect(isSimplifyRequestFailure(validateSimplifyRequest(null))).toBe(true);
    expect(
      validateSimplifyRequest({
        dinnerId: "dinner-chicken-rice",
        cookableIngredientNames: ["Chicken"],
      }),
    ).toEqual({
      type: "seeded",
      dinnerId: "dinner-chicken-rice",
      cookableIngredientNames: ["Chicken"],
    });
  });

  it("validates AI dinner requests against server cookable list", () => {
    const result = validateSimplifyRequest({
      aiDinner: {
        name: "Quick bowl",
        minutes: 18,
        ingredientNames: ["Chicken", "Rice", "Salt"],
        steps: ["Cook rice.", "Pan-fry chicken with salt."],
      },
      today: "2026-09-29",
      ingredients: [
        {
          id: "1",
          name: "Chicken",
          reminderDate: "2026-09-30",
          status: "available",
        },
        {
          id: "2",
          name: "Rice",
          reminderDate: "2026-10-01",
          status: "available",
        },
      ],
    });
    expect(isSimplifyRequestFailure(result)).toBe(false);
    if (!isSimplifyRequestFailure(result)) {
      expect(result.type).toBe("ai");
      if (result.type === "ai") {
        expect(result.meal.name).toBe("Quick bowl");
        expect(result.cookableIngredientNames).toEqual(["Chicken", "Rice"]);
      }
    }
  });

  it("rejects AI dinner requests with unlisted ingredients", () => {
    const result = validateSimplifyRequest({
      aiDinner: {
        name: "Pasta",
        minutes: 15,
        ingredientNames: ["Pasta"],
        steps: ["Boil pasta.", "Serve."],
      },
      today: "2026-09-29",
      ingredients: [
        {
          id: "1",
          name: "Rice",
          reminderDate: "2026-10-01",
          status: "available",
        },
      ],
    });
    expect(isSimplifyRequestFailure(result)).toBe(true);
  });

  it("uses injected chat completion without calling the network in tests", async () => {
    const chatCompletion = vi.fn().mockResolvedValue(
      "1. Simmer rice.\n2. Pan-fry chicken.\n3. Plate and eat.",
    );
    vi.stubEnv("OPENAI_API_KEY", "test-key");

    const result = await simplifyDinnerWithOpenAI(
      dinner,
      ["Chicken", "Rice"],
      chatCompletion,
    );

    expect(result.ok).toBe(true);
    expect(chatCompletion).toHaveBeenCalledOnce();
    vi.unstubAllEnvs();
  });

  it("returns a friendly error when the API key is missing", async () => {
    vi.stubEnv("OPENAI_API_KEY", "");
    const result = await simplifyDinnerWithOpenAI(dinner, ["Chicken"]);
    expect(result.ok).toBe(false);
    vi.unstubAllEnvs();
  });
});
