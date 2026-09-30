"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { QUICK_SELECT_MEATS } from "@/lib/quick-select-meats";
import { isAvailableIngredientNameOnList } from "@/lib/validate-ingredient";
import type { Ingredient } from "@/lib/types";

type QuickSelectMeatsProps = {
  ingredients: Ingredient[];
  selectedName: string;
  onSelect: (name: string) => void;
};

export function QuickSelectMeats({
  ingredients,
  selectedName,
  onSelect,
}: QuickSelectMeatsProps) {
  return (
    <div className="space-y-2">
      <Label className="text-muted-foreground">Quick select</Label>
      <div className="flex flex-wrap gap-2">
        {QUICK_SELECT_MEATS.map((meat) => {
          const onList = isAvailableIngredientNameOnList(ingredients, meat);
          const isSelected =
            selectedName.trim().toLowerCase() === meat.toLowerCase();
          return (
            <Button
              key={meat}
              type="button"
              size="sm"
              variant={isSelected ? "default" : "outline"}
              disabled={onList}
              aria-pressed={isSelected}
              onClick={() => onSelect(meat)}
            >
              {meat}
            </Button>
          );
        })}
      </div>
      <p className="text-sm text-muted-foreground">
        Fills the name only — pick a reminder date, then add. You can still type
        any other ingredient.
      </p>
    </div>
  );
}
