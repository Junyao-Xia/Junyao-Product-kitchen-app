/** Quick-select labels in Add ingredient — not assumed pantry; must be cookable on the list for AI. */
export const QUICK_SELECT_MEATS = [
  "Beef",
  "Pork",
  "Chicken",
  "Duck",
] as const;

export type QuickSelectMeat = (typeof QUICK_SELECT_MEATS)[number];
