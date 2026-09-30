import { describe, expect, it } from "vitest";
import { isAssumedPantryStapleName } from "@/lib/assumed-pantry";
import { QUICK_SELECT_MEATS } from "@/lib/quick-select-meats";

describe("quick select meats", () => {
  it("does not treat quick-select meats as assumed pantry", () => {
    for (const meat of QUICK_SELECT_MEATS) {
      expect(isAssumedPantryStapleName(meat)).toBe(false);
    }
  });
});
