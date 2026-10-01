import seedDinners from "@/data/dinners.json";
import { describe, expect, it } from "vitest";
import {
  CHICKEN_COOKING_RULE_FOR_AI,
  CHICKEN_THERMOMETER_DONENESS,
} from "@/lib/chicken-cooking";
import type { Dinner } from "@/lib/types";

describe("chicken cooking guidance", () => {
  it("uses thermometer doneness language", () => {
    expect(CHICKEN_THERMOMETER_DONENESS).toContain("165°F");
    expect(CHICKEN_THERMOMETER_DONENESS).toContain("74°C");
    expect(CHICKEN_COOKING_RULE_FOR_AI).toContain("food thermometer");
  });

  it("does not use pink-only or fixed-minute chicken cues in seed dinners", () => {
    const chickenSteps = (seedDinners as Dinner[])
      .filter((dinner) => dinner.ingredientNames.includes("Chicken"))
      .flatMap((dinner) => dinner.steps)
      .join(" ");
    expect(chickenSteps).toContain("165°F");
    expect(chickenSteps).toContain("74°C");
    expect(chickenSteps).not.toMatch(/no pink/i);
    expect(chickenSteps).not.toMatch(/about 7 minutes/i);
  });
});
