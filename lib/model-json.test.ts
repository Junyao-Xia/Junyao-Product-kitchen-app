import { describe, expect, it } from "vitest";
import { extractJsonPayload } from "@/lib/model-json";

describe("extractJsonPayload", () => {
  it("unwraps markdown fenced JSON", () => {
    const raw = "```json\n{\"suggestions\":[]}\n```";
    expect(extractJsonPayload(raw)).toBe('{"suggestions":[]}');
  });

  it("extracts a JSON object from surrounding prose", () => {
    const raw = 'Here you go:\n{"alreadySimple":true,"message":"Done."}\nThanks';
    expect(JSON.parse(extractJsonPayload(raw))).toEqual({
      alreadySimple: true,
      message: "Done.",
    });
  });
});
