import { describe, expect, it } from "vitest";
import seedDinners from "@/data/dinners.json";
import {
  allowedSimplifyIngredientNames,
  parseSimplifyResponse,
} from "@/lib/simplify-dinner";
import type { Dinner } from "@/lib/types";

const chickenRice = (seedDinners as Dinner[]).find(
  (d) => d.id === "dinner-chicken-rice",
)!;

describe("simplify regressions (spec 004)", () => {
  it("accepts plain numbered steps without JSON", () => {
    const allowed = allowedSimplifyIngredientNames(chickenRice, [
      "Chicken",
      "Rice",
    ]);
    const result = parseSimplifyResponse(
      "1. Simmer rice in one pot.\n2. Pan-fry chicken in the same pot.\n3. Serve.",
      allowed,
      ["Chicken", "Rice"],
      chickenRice.steps,
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.lines.length).toBeGreaterThan(0);
      expect(result.improvement.length).toBeGreaterThan(0);
    }
  });

  it("returns already simple for minimal seeded chicken and rice", () => {
    const allowed = allowedSimplifyIngredientNames(chickenRice, [
      "Chicken",
      "Rice",
    ]);
    const result = parseSimplifyResponse(
      JSON.stringify({
        alreadySimple: true,
        message: "This recipe is already pretty simple.",
      }),
      allowed,
      ["Chicken", "Rice"],
      chickenRice.steps,
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.alreadySimple).toBe(true);
    }
  });

  it("falls back to already simple when effort cannot be reduced", () => {
    const allowed = allowedSimplifyIngredientNames(chickenRice, [
      "Chicken",
      "Rice",
    ]);
    const result = parseSimplifyResponse(
      JSON.stringify({
        alreadySimple: false,
        lines: [
          "Rinse rice and simmer in a pot.",
          "Cut chicken and pan-fry in a skillet.",
          "Fluff rice and serve with chicken.",
        ],
        improvement: "Uses one pot instead of two.",
      }),
      allowed,
      ["Chicken", "Rice"],
      chickenRice.steps,
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.alreadySimple).toBe(true);
    }
  });

  it("unwraps markdown JSON from the model", () => {
    const allowed = allowedSimplifyIngredientNames(chickenRice, [
      "Chicken",
      "Rice",
    ]);
    const result = parseSimplifyResponse(
      "```json\n" +
        JSON.stringify({
          alreadySimple: false,
          lines: [
            "Simmer rice in one pot.",
            "Pan-fry chicken in the same pot and serve.",
          ],
          improvement: "Uses one pot instead of a pot and a skillet.",
        }) +
        "\n```",
      allowed,
      ["Chicken", "Rice"],
      chickenRice.steps,
    );
    expect(result.ok).toBe(true);
  });
});
