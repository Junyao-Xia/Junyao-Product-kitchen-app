import { describe, expect, it } from "vitest";
import seedDinners from "@/data/dinners.json";
import {
  allowedSimplifyIngredientNames,
  parseSimplifyResponse,
  validateSimplifyLines,
} from "@/lib/simplify-dinner";
import {
  effortReducedVersusOriginal,
  isAlreadySimpleMeal,
} from "@/lib/simplify-effort";
import type { Dinner } from "@/lib/types";

const chickenRice = (seedDinners as Dinner[]).find(
  (d) => d.id === "dinner-chicken-rice",
)!;

describe("simplify regressions (spec 004)", () => {
  it("treats each seeded dinner as eligible for meaningful simplification", () => {
    for (const dinner of seedDinners as Dinner[]) {
      expect(dinner.steps.length).toBeGreaterThanOrEqual(4);
      expect(isAlreadySimpleMeal(dinner.steps)).toBe(false);
    }
  });

  it("accepts plain numbered steps without JSON", () => {
    const allowed = allowedSimplifyIngredientNames(chickenRice, [
      "Chicken",
      "Rice",
    ]);
    const result = parseSimplifyResponse(
      "1. Simmer rice in one pot.\n2. Pan-fry chicken in the same pot.\n3. Serve.",
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

  it("accepts an honest one-pot rewrite for seeded chicken and rice", () => {
    const allowed = allowedSimplifyIngredientNames(chickenRice, [
      "Chicken",
      "Rice",
    ]);
    const result = parseSimplifyResponse(
      JSON.stringify({
        alreadySimple: false,
        lines: [
          "Cut chicken into bite-size pieces and season with salt and pepper.",
          "Add chicken, rice, and 1½ cups water to one pot. Cover and simmer until the rice is tender and the thickest part of the chicken reads 165°F (74°C) on a food thermometer.",
          "Serve.",
        ],
        improvement: "Uses one pot instead of a saucepan and skillet.",
      }),
      allowed,
      ["Chicken", "Rice"],
      chickenRice.steps,
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.alreadySimple).not.toBe(true);
      expect(result.improvement.toLowerCase()).toMatch(/one pot|fewer pan/);
    }
  });

  it("replaces a false two-pan claim with an honest shortcut summary for one-pot chicken and rice", () => {
    const simplifiedLines = [
      "Add chicken, rice, water, and oil to one pot. Cover and simmer until the rice is tender and the thickest part of the chicken reads 165°F (74°C) on a food thermometer.",
      "Serve.",
    ];
    expect(
      effortReducedVersusOriginal(chickenRice.steps, simplifiedLines),
    ).toBe(true);

    const allowed = allowedSimplifyIngredientNames(chickenRice, [
      "Chicken",
      "Rice",
    ]);
    const validated = validateSimplifyLines(
      simplifiedLines,
      allowed,
      ["Chicken", "Rice"],
      chickenRice.steps,
    );
    expect(validated.ok).toBe(true);
    if (validated.ok && !validated.alreadySimple) {
      expect(validated.lines.length).toBeGreaterThan(0);
    }

    const invalid = validateSimplifyLines(
      ["Add soy sauce.", "Cook chicken."],
      allowed,
      ["Chicken", "Rice"],
      chickenRice.steps,
    );
    expect(invalid.ok).toBe(false);

    const result = parseSimplifyResponse(
      JSON.stringify({
        alreadySimple: false,
        lines: simplifiedLines,
        improvement: "Uses one pan instead of two.",
      }),
      allowed,
      ["Chicken", "Rice"],
      chickenRice.steps,
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.alreadySimple).not.toBe(true);
      expect(result.improvement.toLowerCase()).toMatch(/pot|pan|fewer|combines|instead/);
    }
  });

  it("rejects a rewrite that keeps separate cookware for seeded chicken and rice", () => {
    const allowed = allowedSimplifyIngredientNames(chickenRice, [
      "Chicken",
      "Rice",
    ]);
    const result = parseSimplifyResponse(
      JSON.stringify({
        alreadySimple: false,
        lines: [
          "Rinse rice. Slice chicken into thin strips and season.",
          "Simmer rice in a saucepan, covered, about 12 minutes.",
          "Cook chicken in a skillet until 165°F (74°C) on a food thermometer.",
          "Fluff rice, fold in chicken, and rest 1 minute before serving.",
        ],
        improvement: "Uses one pot instead of two.",
      }),
      allowed,
      ["Chicken", "Rice"],
      chickenRice.steps,
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe("no_effort_reduction");
    }
  });
});
