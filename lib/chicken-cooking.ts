/** Shared copy for seeded recipes and AI prompts — doneness by temperature, not color or fixed minutes alone. */
export const CHICKEN_THERMOMETER_DONENESS =
  "the thickest part reads 165°F (74°C) on a food thermometer";

export const CHICKEN_COOKING_RULE_FOR_AI = [
  "For chicken, say to cook until the thickest part reaches 165°F (74°C) on a food thermometer.",
  "Do not rely on a fixed minute count alone or on color cues such as no pink for doneness.",
].join(" ");
