import { describe, expect, it, vi } from "vitest";
import seedDinners from "@/data/dinners.json";
import {
  allowedSimplifyIngredientNames,
  buildSimplifySystemPrompt,
  buildSimplifyUserPrompt,
  parseSimplifyResponse,
  simplifyDinnerWithOpenAI,
  isSimplifyRequestFailure,
  validateSimplifyRequest,
} from "@/lib/simplify-dinner";
import type { Dinner } from "@/lib/types";

const seededChickenRice = (seedDinners as Dinner[]).find(
  (item) => item.id === "dinner-chicken-rice",
)!;

const dinner: Dinner = {
  id: "dinner-chicken-rice",
  name: "Chicken and rice",
  minutes: 20,
  ingredientNames: ["Chicken", "Rice"],
  steps: ["Cook rice.", "Cook chicken."],
};

describe("simplify-dinner", () => {
  it("tells the model not to claim fewer pans for an already one-skillet dinner", () => {
    expect(buildSimplifySystemPrompt()).toContain(
      "Never claim fewer pans if the original already cooks in one skillet",
    );
  });

  it("builds a prompt with dinner name, time, and cookable ingredients", () => {
    const prompt = buildSimplifyUserPrompt(dinner, ["Chicken", "Rice"]);
    expect(prompt).toContain("Chicken and rice");
    expect(prompt).toContain("20 minutes");
    expect(prompt).toContain("Chicken, Rice");
    expect(prompt).toContain("Cook rice.");
    expect(prompt).toContain("Assumed staples");
  });

  it("parses JSON simplify responses with improvement", () => {
    const allowed = allowedSimplifyIngredientNames(dinner, ["Chicken", "Rice"]);
    const result = parseSimplifyResponse(
      JSON.stringify({
        alreadySimple: false,
        lines: [
          "Simmer rice and pan-fry chicken in one pot.",
          "Serve together.",
        ],
        improvement: "Uses one pot instead of separate rice and chicken pans.",
      }),
      allowed,
      ["Chicken", "Rice"],
      [
        "Simmer rice in a pot.",
        "Pan-fry chicken in a skillet.",
        "Combine and serve.",
      ],
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.lines).toHaveLength(2);
      expect(result.improvement).toContain("one pot");
    }
  });

  it("rejects safety language in the response", () => {
    const allowed = allowedSimplifyIngredientNames(dinner, ["Chicken", "Rice"]);
    const result = parseSimplifyResponse(
      JSON.stringify({
        alreadySimple: false,
        lines: ["The chicken is safe to eat.", "Cook it."],
        improvement: "Uses one pan.",
      }),
      allowed,
      ["Chicken", "Rice"],
      dinner.steps,
    );
    expect(result.ok).toBe(false);
  });

  it("allows water in simplified steps when cooking rice", () => {
    const allowed = allowedSimplifyIngredientNames(dinner, ["Chicken", "Rice"]);
    const result = parseSimplifyResponse(
      JSON.stringify({
        alreadySimple: false,
        lines: [
          "Simmer rice in water for 12 minutes.",
          "Pan-fry chicken with salt and oil in the same pan.",
          "Serve.",
        ],
        improvement: "Combines cooking in one pan.",
      }),
      allowed,
      ["Chicken", "Rice"],
      dinner.steps,
    );
    expect(result.ok).toBe(true);
  });

  it("allows assumed staples in simplified steps", () => {
    const allowed = allowedSimplifyIngredientNames(dinner, ["Chicken", "Rice"]);
    const result = parseSimplifyResponse(
      JSON.stringify({
        alreadySimple: false,
        lines: [
          "Season chicken with salt and pepper.",
          "Cook rice in a little oil.",
        ],
        improvement: "Keeps the same two quick steps.",
      }),
      allowed,
      ["Chicken", "Rice"],
      dinner.steps,
    );
    expect(result.ok).toBe(true);
  });

  it("rejects simplify steps that mention unlisted seasonings", () => {
    const allowed = allowedSimplifyIngredientNames(dinner, ["Chicken", "Rice"]);
    const result = parseSimplifyResponse(
      JSON.stringify({
        alreadySimple: false,
        lines: ["Add soy sauce.", "Cook chicken."],
        improvement: "Uses one pan.",
      }),
      allowed,
      ["Chicken", "Rice"],
      dinner.steps,
    );
    expect(result.ok).toBe(false);
  });

  it("rejects overlong responses", () => {
    const words = Array.from({ length: 130 }, (_, index) => `word${index}`).join(
      " ",
    );
    const allowed = allowedSimplifyIngredientNames(dinner, ["Chicken", "Rice"]);
    const result = parseSimplifyResponse(
      JSON.stringify({
        alreadySimple: false,
        lines: [words, "Done."],
        improvement: "Uses one pan instead of two.",
      }),
      allowed,
      ["Chicken", "Rice"],
      dinner.steps,
    );
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
      JSON.stringify({
        alreadySimple: false,
        lines: [
          "Simmer rice and chicken together in one pot.",
          "Season with salt and pepper.",
          "Plate and eat.",
        ],
        improvement: "Uses one pot instead of separate pans.",
      }),
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

  it("accepts plain numbered simplify steps when JSON parsing fails", () => {
    const allowed = allowedSimplifyIngredientNames(dinner, ["Chicken", "Rice"]);
    const result = parseSimplifyResponse(
      "1. Simmer chicken and rice in one pot.\n2. Serve together.",
      allowed,
      ["Chicken", "Rice"],
      [
        "Cook rice in a pot.",
        "Cook chicken in a skillet.",
        "Combine and serve.",
      ],
    );
    expect(result.ok).toBe(true);
  });

  it("returns already simple JSON from the model", () => {
    const allowed = allowedSimplifyIngredientNames(dinner, ["Chicken", "Rice"]);
    const result = parseSimplifyResponse(
      JSON.stringify({
        alreadySimple: true,
        message: "This recipe is already simple.",
      }),
      allowed,
      ["Chicken", "Rice"],
      dinner.steps,
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.alreadySimple).toBe(true);
    }
  });

  it("replaces a false two-pan claim for seeded one-skillet chicken and rice", () => {
    const allowed = allowedSimplifyIngredientNames(seededChickenRice, [
      "Chicken",
      "Rice",
    ]);
    const result = parseSimplifyResponse(
      JSON.stringify({
        alreadySimple: false,
        lines: [
          "Simmer chicken and rice with water in a skillet until done.",
          "Serve.",
        ],
        improvement: "Uses one pan instead of two.",
      }),
      allowed,
      ["Chicken", "Rice"],
      seededChickenRice.steps,
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.improvement.toLowerCase()).not.toContain("instead of two");
      expect(result.improvement.toLowerCase()).toMatch(/brown|skips|skillet/);
    }
  });

  it("returns a friendly error when the API key is missing", async () => {
    vi.stubEnv("OPENAI_API_KEY", "");
    const result = await simplifyDinnerWithOpenAI(dinner, ["Chicken"]);
    expect(result.ok).toBe(false);
    vi.unstubAllEnvs();
  });

  it("retries once when the first model response does not reduce effort", async () => {
    const multiVesselDinner = {
      ...dinner,
      steps: [
        "Simmer rice in a pot.",
        "Pan-fry chicken in a skillet.",
        "Combine and serve.",
      ],
    };
    const chatCompletion = vi
      .fn()
      .mockResolvedValueOnce(
        JSON.stringify({
          alreadySimple: false,
          lines: [
            "Simmer rice in a pot.",
            "Pan-fry chicken in a skillet.",
            "Plate and serve.",
          ],
          improvement: "Uses one pot instead of separate pans.",
        }),
      )
      .mockResolvedValueOnce(
        JSON.stringify({
          alreadySimple: false,
          lines: [
            "Simmer chicken and rice in one pot.",
            "Season with salt and pepper.",
            "Serve.",
          ],
          improvement: "Uses one pot instead of separate rice and chicken pans.",
        }),
      );
    vi.stubEnv("OPENAI_API_KEY", "test-key");

    const result = await simplifyDinnerWithOpenAI(
      multiVesselDinner,
      ["Chicken", "Rice"],
      chatCompletion,
    );

    expect(chatCompletion).toHaveBeenCalledTimes(2);
    expect(result.ok).toBe(true);
    vi.unstubAllEnvs();
  });

  it("returns a friendly error when chat completion throws", async () => {
    vi.stubEnv("OPENAI_API_KEY", "test-key");
    const chatCompletion = vi.fn().mockRejectedValue(new Error("network"));
    const result = await simplifyDinnerWithOpenAI(
      dinner,
      ["Chicken", "Rice"],
      chatCompletion,
    );
    expect(result.ok).toBe(false);
    vi.unstubAllEnvs();
  });

  it("rejects seeded simplify requests with missing or empty fields", () => {
    expect(
      isSimplifyRequestFailure(
        validateSimplifyRequest({
          dinnerId: "",
          cookableIngredientNames: ["Chicken"],
        }),
      ),
    ).toBe(true);
    expect(
      isSimplifyRequestFailure(
        validateSimplifyRequest({
          dinnerId: "dinner-chicken-rice",
          cookableIngredientNames: [],
        }),
      ),
    ).toBe(true);
    expect(
      isSimplifyRequestFailure(
        validateSimplifyRequest({
          dinnerId: "dinner-chicken-rice",
          cookableIngredientNames: ["  "],
        }),
      ),
    ).toBe(true);
  });
});
