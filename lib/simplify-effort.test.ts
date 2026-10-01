import { describe, expect, it } from "vitest";
import {
  effortReducedVersusOriginal,
  improvementClaimSupported,
  isAlreadySimpleMeal,
} from "@/lib/simplify-effort";

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

  it("requires one-pan claims to match the rewritten steps", () => {
    expect(
      improvementClaimSupported("Uses one pan instead of two.", [
        "Brown chicken in a skillet.",
        "Add rice and simmer in the same pan.",
      ]),
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
});
