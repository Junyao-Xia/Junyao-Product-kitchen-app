import { describe, expect, it } from "vitest";
import {
  CHICKEN_COOKING_RULE_FOR_AI,
  CHICKEN_THERMOMETER_DONENESS,
} from "@/lib/chicken-cooking";

describe("chicken cooking guidance", () => {
  it("uses thermometer doneness language", () => {
    expect(CHICKEN_THERMOMETER_DONENESS).toContain("165°F");
    expect(CHICKEN_THERMOMETER_DONENESS).toContain("74°C");
    expect(CHICKEN_COOKING_RULE_FOR_AI).toContain("food thermometer");
    expect(CHICKEN_COOKING_RULE_FOR_AI).not.toMatch(/no pink/i);
  });
});
