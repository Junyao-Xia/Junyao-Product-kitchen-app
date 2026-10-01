import { describe, expect, it } from "vitest";
import seedDinners from "@/data/dinners.json";
import {
  allowedSimplifyIngredientNames,
  parseSimplifyResponse,
} from "@/lib/simplify-dinner";
import { effortReducedVersusOriginal } from "@/lib/simplify-effort";
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

  it("replaces a false two-pan claim with an honest shortcut summary for one-skillet chicken and rice", () => {
    const simplifiedLines = [
      "Add chicken, rice, water, and oil to a skillet. Cover and simmer until the rice is tender and the thickest part of the chicken reads 165°F (74°C) on a food thermometer.",
      "Fluff and serve.",
    ];
    expect(
      effortReducedVersusOriginal(chickenRice.steps, simplifiedLines),
    ).toBe(true);

    const allowed = allowedSimplifyIngredientNames(chickenRice, [
      "Chicken",
      "Rice",
    ]);
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
      expect(result.improvement.toLowerCase()).not.toContain("instead of two");
      expect(result.improvement.toLowerCase()).toMatch(/brown|skips|aside|skillet/);
    }
  });

  it("returns already simple when the rewrite does not reduce a one-skillet seeded meal", () => {
    const allowed = allowedSimplifyIngredientNames(chickenRice, [
      "Chicken",
      "Rice",
    ]);
    const result = parseSimplifyResponse(
      JSON.stringify({
        alreadySimple: false,
        lines: [
          "Rinse rice and cut chicken.",
          "Brown chicken in a skillet, then push it aside.",
          "Add rice and water to the same skillet, simmer, and serve.",
        ],
        improvement: "Uses one pan instead of two.",
      }),
      allowed,
      ["Chicken", "Rice"],
      chickenRice.steps,
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.alreadySimple).toBe(true);
      expect(result.improvement).toBe("This recipe is already simple.");
    }
  });
});
