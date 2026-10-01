import { describe, expect, it } from "vitest";
import {
  ASSUMED_PANTRY_NOTE,
  findForbiddenPantryMentions,
  resolveAssumedPantryStaple,
  resolveCookableOrAssumedPantryName,
} from "@/lib/assumed-pantry";

describe("assumed pantry", () => {
  it("exposes the UI note copy", () => {
    expect(ASSUMED_PANTRY_NOTE).toBe(
      "Assumes cooking oil, salt, and black pepper.",
    );
  });

  it("resolves assumed staples without a list entry", () => {
    expect(resolveAssumedPantryStaple("")).toBeNull();
    expect(resolveAssumedPantryStaple("salt")).toBe("Salt");
    expect(resolveAssumedPantryStaple("oil")).toBe("Cooking oil");
    expect(resolveAssumedPantryStaple("pepper")).toBe("Black pepper");
    expect(resolveAssumedPantryStaple("cooking oil")).toBe("Cooking oil");
    expect(resolveCookableOrAssumedPantryName("Salt", ["Rice"])).toBe("Salt");
  });

  it("still flags non-assumed pantry terms", () => {
    expect(findForbiddenPantryMentions("add soy sauce", ["Rice"])).toContain(
      "soy sauce",
    );
    expect(findForbiddenPantryMentions("salt and oil", ["Rice"])).toEqual([]);
    expect(findForbiddenPantryMentions("simmer rice in water", ["Rice"])).toEqual(
      [],
    );
  });
});
