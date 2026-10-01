import { describe, expect, it } from "vitest";
import seedDinners from "@/data/dinners.json";
import {
  claimsFewerPansThanBefore,
  effortReducedVersusOriginal,
  inferDefaultImprovement,
  improvementClaimSupported,
  isAlreadySimpleMeal,
  isOneSkilletMeal,
  originalUsesSingleCookingVessel,
} from "@/lib/simplify-effort";
import type { Dinner } from "@/lib/types";

const chickenRice = (seedDinners as Dinner[]).find(
  (d) => d.id === "dinner-chicken-rice",
)!;

describe("simplify effort", () => {
  it("detects already-simple meals", () => {
    expect(isAlreadySimpleMeal(["Season chicken.", "Pan-fry in one pan."])).toBe(
      true,
    );
    expect(
      isAlreadySimpleMeal([
        "Boil rice in a pot.",
        "Pan-fry chicken in a skillet.",
        "Steam vegetables in another pot.",
      ]),
    ).toBe(false);
  });

  it("detects when the original already uses one cooking vessel", () => {
    expect(originalUsesSingleCookingVessel(chickenRice.steps)).toBe(true);
    expect(isOneSkilletMeal(chickenRice.steps)).toBe(true);
    expect(isAlreadySimpleMeal(chickenRice.steps)).toBe(true);
  });

  it("rejects fewer-pan claims when the original already uses one skillet", () => {
    expect(
      improvementClaimSupported(
        "Uses one pan instead of two.",
        [
          "Simmer chicken and rice in one skillet.",
          "Serve.",
        ],
        chickenRice.steps,
      ),
    ).toBe(false);
    expect(
      improvementClaimSupported(
        "Skips browning the chicken and simmers everything in one skillet.",
        [
          "Simmer chicken and rice in one skillet.",
          "Serve.",
        ],
        chickenRice.steps,
      ),
    ).toBe(true);
  });

  it("requires one-pan claims to match the rewritten steps when the original used multiple vessels", () => {
    const original = [
      "Simmer rice in a pot.",
      "Pan-fry chicken in a skillet.",
      "Combine and serve.",
    ];
    expect(
      improvementClaimSupported(
        "Uses one pan instead of two.",
        [
          "Brown chicken in a skillet.",
          "Add rice and simmer in the same pan.",
        ],
        original,
      ),
    ).toBe(true);
    expect(
      improvementClaimSupported("Combines the recipe into two short steps.", [
        "Boil rice in a pot.",
        "Pan-fry chicken separately.",
      ]),
    ).toBe(true);
  });

  it("allows a longer rewrite when the original already had many steps", () => {
    const original = Array.from({ length: 5 }, (_, index) => `Prep item ${index}.`);
    const simplified = Array.from({ length: 6 }, (_, index) => `Step ${index}.`);
    expect(effortReducedVersusOriginal(original, simplified)).toBe(true);
  });

  it("accepts fewer steps as effort reduction", () => {
    expect(
      effortReducedVersusOriginal(
        ["Cook rice.", "Cook chicken in a pan.", "Combine and serve."],
        ["Simmer chicken and rice together in one pot.", "Serve."],
      ),
    ).toBe(true);
  });

  it("does not treat shorter rewrites as effort reduction for already-simple one-skillet meals", () => {
    expect(
      effortReducedVersusOriginal(chickenRice.steps, [
        "Season chicken and rinse rice.",
        "Simmer chicken and rice in the same skillet until done.",
        "Serve.",
      ]),
    ).toBe(false);
  });

  it("allows a recognized shortcut when browning is removed from one-skillet chicken and rice", () => {
    expect(
      effortReducedVersusOriginal(chickenRice.steps, [
        "Add chicken, rice, and water to a skillet and simmer until the chicken reads 165°F (74°C) on a food thermometer.",
        "Serve.",
      ]),
    ).toBe(true);
  });

  it("infers skip-browning copy instead of fewer-pans for one-skillet chicken and rice", () => {
    expect(
      inferDefaultImprovement(chickenRice.steps, [
        "Simmer chicken and rice together in a skillet.",
        "Serve.",
      ]),
    ).toMatch(/Skips browning/i);
    expect(claimsFewerPansThanBefore("Uses one pan instead of two.")).toBe(
      true,
    );
    expect(improvementClaimSupported("", ["Step one.", "Step two."])).toBe(
      false,
    );
  });

  it("allows honest one-pan wording when the original used separate cookware", () => {
    const original = [
      "Simmer rice in a pot.",
      "Pan-fry chicken in a skillet.",
      "Serve.",
    ];
    expect(
      improvementClaimSupported(
        "Uses one pan for everything.",
        ["Brown chicken, add rice, and simmer in one pan.", "Serve."],
        original,
      ),
    ).toBe(true);
  });

  it("infers push-aside shortcut copy when that step is removed", () => {
    expect(
      inferDefaultImprovement(
        [
          "Brown chicken and push it to the side of the pan.",
          "Add rice to the same skillet and simmer.",
        ],
        ["Simmer chicken and rice in one skillet.", "Serve."],
      ),
    ).toMatch(/pushing the meat aside/i);
  });

  it("rejects effort reduction when simplified steps add extra cookware", () => {
    expect(effortReducedVersusOriginal(chickenRice.steps, [])).toBe(false);
    expect(
      effortReducedVersusOriginal(chickenRice.steps, [
        "Boil rice in a pot.",
        "Fry chicken in a skillet.",
        "Serve.",
      ]),
    ).toBe(false);
  });
});
