export type IngredientStatus = "available" | "used";

export type Ingredient = {
  id: string;
  name: string;
  reminderDate: string;
  status: IngredientStatus;
};

export type SeedIngredient = {
  id: string;
  name: string;
  reminderOffsetDays: number;
  status: IngredientStatus;
};

export type Dinner = {
  id: string;
  name: string;
  minutes: number;
  ingredientNames: string[];
  steps: string[];
};

/** Ephemeral AI suggestion — not stored in seed JSON or localStorage. */
export type AiDinnerSuggestion = {
  id: string;
  name: string;
  minutes: number;
  ingredientNames: string[];
  steps: string[];
};

export type IngredientSnapshotItem = Pick<
  Ingredient,
  "id" | "name" | "reminderDate" | "status"
>;
