import { describe, expect, it } from "vitest";
import seedDinners from "@/data/dinners.json";
import {
  claimsFewerPansThanBefore,
  effectiveCookwareCount,
  effortReducedVersusOriginal,
  inferDefaultImprovement,
  improvementClaimSupported,
  isAlreadySimpleMeal,
  isOneSkilletMeal,
  originalUsesSingleCookingVessel,
  usesSingleCookingPanWithTransfers,
} from "@/lib/simplify-effort";
import type { Dinner } from "@/lib/types";

const chickenRice = (seedDinners as Dinner[]).find(
  (d) => d.id === "dinner-chicken-rice",
)!;
const eggFriedRice = (seedDinners as Dinner[]).find(
  (d) => d.id === "dinner-egg-fried-rice",
)!;
const spinachEggs = (seedDinners as Dinner[]).find(
  (d) => d.id === "dinner-spinach-eggs",
)!;

const oneSkilletChickenRice = [
  "Rinse rice and cut chicken into bite-size pieces. Season with salt and pepper.",
  "Heat oil in a large deep skillet over medium-high. Brown chicken on all sides, then push it to the side of the pan.",
  "Add rice and water to the same skillet. Cover and simmer until the rice is tender and the chicken reads 165°F (74°C) on a food thermometer.",
  "Fluff the rice, mix in the chicken, and serve.",
];

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

  it("detects when seeded chicken and rice uses separate cookware", () => {
    expect(originalUsesSingleCookingVessel(chickenRice.steps)).toBe(false);
    expect(isOneSkilletMeal(chickenRice.steps)).toBe(false);
    expect(isAlreadySimpleMeal(chickenRice.steps)).toBe(false);
  });

  it("detects when the original already uses one cooking vessel", () => {
    expect(originalUsesSingleCookingVessel(oneSkilletChickenRice)).toBe(true);
    expect(isOneSkilletMeal(oneSkilletChickenRice)).toBe(true);
    expect(isAlreadySimpleMeal(oneSkilletChickenRice)).toBe(true);
  });

  it("rejects fewer-pan claims when the original already uses one skillet", () => {
    expect(
      improvementClaimSupported(
        "Uses one pan instead of two.",
        [
          "Simmer chicken and rice in one skillet.",
          "Serve.",
        ],
        oneSkilletChickenRice,
      ),
    ).toBe(false);
    expect(
      improvementClaimSupported(
        "Skips browning the chicken and simmers everything in one skillet.",
        [
          "Simmer chicken and rice in one skillet.",
          "Serve.",
        ],
        oneSkilletChickenRice,
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
      effortReducedVersusOriginal(oneSkilletChickenRice, [
        "Season chicken and rinse rice.",
        "Simmer chicken and rice in the same skillet until done.",
        "Serve.",
      ]),
    ).toBe(false);
  });

  it("allows a recognized shortcut when browning is removed from one-skillet chicken and rice", () => {
    expect(
      effortReducedVersusOriginal(oneSkilletChickenRice, [
        "Add chicken, rice, and water to a skillet and simmer until the chicken reads 165°F (74°C) on a food thermometer.",
        "Serve.",
      ]),
    ).toBe(true);
  });

  it("treats combining saucepan and skillet into one pot as effort reduction for seeded chicken and rice", () => {
    expect(
      effortReducedVersusOriginal(chickenRice.steps, [
        "Add chicken, rice, water, and oil to one pot. Cover and simmer until the rice is tender and the thickest part of the chicken reads 165°F (74°C) on a food thermometer.",
        "Serve.",
      ]),
    ).toBe(true);
  });

  it("infers skip-browning copy instead of fewer-pans for one-skillet chicken and rice", () => {
    expect(
      inferDefaultImprovement(oneSkilletChickenRice, [
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
          "Cook chicken and push it to the side of the pan.",
          "Add rice to the same skillet and simmer.",
        ],
        ["Simmer chicken and rice in one skillet.", "Serve."],
      ),
    ).toMatch(/pushing the meat aside/i);
  });

  it("counts one-skillet meals as a single vessel for comparisons", () => {
    expect(effectiveCookwareCount(oneSkilletChickenRice)).toBe(1);
    expect(effectiveCookwareCount(chickenRice.steps)).toBe(2);
    expect(
      effectiveCookwareCount([
        "Cook rice in a pot.",
        "Cook chicken in a skillet.",
      ]),
    ).toBe(2);
  });

  it("accepts long generic improvement copy without a keyword", () => {
    expect(
      improvementClaimSupported(
        "This version keeps the same ingredients with clearer steps.",
        ["Simmer chicken and rice.", "Serve."],
      ),
    ).toBe(true);
  });

  it("infers fewer-pan copy when simplified steps drop a second vessel", () => {
    expect(
      inferDefaultImprovement(
        [
          "Simmer rice in a pot.",
          "Pan-fry chicken in a skillet.",
          "Serve.",
        ],
        ["Brown chicken, add rice, and simmer in one pan.", "Serve."],
      ),
    ).toBe("Uses fewer pans than the original steps.");
  });

  it("infers combined-step copy when the rewrite is shorter but not a skillet shortcut", () => {
    expect(
      inferDefaultImprovement(
        ["Prep chicken.", "Prep rice.", "Cook chicken.", "Cook rice.", "Serve."],
        ["Cook chicken and rice.", "Serve."],
      ),
    ).toBe("Combines the recipe into 2 short steps.");
  });

  it("detects one-pan seeded meals with plate transfers", () => {
    expect(usesSingleCookingPanWithTransfers(spinachEggs.steps)).toBe(true);
    expect(usesSingleCookingPanWithTransfers(eggFriedRice.steps)).toBe(true);
  });

  it("infers fewer-dishes copy when plate transfers are removed from one-pan workflows", () => {
    expect(
      inferDefaultImprovement(spinachEggs.steps, [
        "Cook spinach and eggs together in one pan until the eggs are softly set.",
        "Season and serve.",
      ]),
    ).toMatch(/transfer|dishes/i);
    const sameCookwareFewerTransfers = [
      "If needed, simmer rice in a saucepan, covered, for 12 minutes.",
      "Scramble eggs in the skillet, add onion and rice, and cook until hot.",
      "Season and serve.",
    ];
    expect(
      improvementClaimSupported(
        "Uses one pan instead of two.",
        sameCookwareFewerTransfers,
        eggFriedRice.steps,
      ),
    ).toBe(false);
    expect(
      improvementClaimSupported(
        "Skips moving eggs to a plate so you wash fewer dishes.",
        sameCookwareFewerTransfers,
        eggFriedRice.steps,
      ),
    ).toBe(true);
  });

  it("rejects effort reduction when simplified steps add extra cookware", () => {
    expect(effortReducedVersusOriginal(oneSkilletChickenRice, [])).toBe(false);
    expect(
      effortReducedVersusOriginal(oneSkilletChickenRice, [
        "Boil rice in a pot.",
        "Fry chicken in a skillet.",
        "Serve.",
      ]),
    ).toBe(false);
  });
});
