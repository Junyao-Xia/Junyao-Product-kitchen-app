"use client";

import { useState } from "react";
import { ReminderDateNote } from "@/components/ReminderDateNote";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatReminderLabel } from "@/lib/dates";
import type { Ingredient } from "@/lib/types";
import {
  hasFieldErrors,
  validateIngredientFields,
  validateKeepDate,
} from "@/lib/validate-ingredient";

type IngredientItemProps = {
  ingredient: Ingredient;
  today: string;
  mode: "useSoon" | "review" | "other";
  onSaveEdit: (id: string, name: string, reminderDate: string) => void;
  onMarkUsed: (id: string) => void;
  onKeep: (id: string, reminderDate: string) => void;
};

export function IngredientItem({
  ingredient,
  today,
  mode,
  onSaveEdit,
  onMarkUsed,
  onKeep,
}: IngredientItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(ingredient.name);
  const [reminderDate, setReminderDate] = useState(ingredient.reminderDate);
  const [keepDate, setKeepDate] = useState(today);
  const [errors, setErrors] = useState<{ name?: string; reminderDate?: string }>(
    {},
  );

  function startEdit() {
    setName(ingredient.name);
    setReminderDate(ingredient.reminderDate);
    setErrors({});
    setIsEditing(true);
  }

  function cancelEdit() {
    setName(ingredient.name);
    setReminderDate(ingredient.reminderDate);
    setErrors({});
    setIsEditing(false);
  }

  function saveEdit() {
    const nextErrors = validateIngredientFields(name, reminderDate);
    setErrors(nextErrors);
    if (hasFieldErrors(nextErrors)) {
      return;
    }
    onSaveEdit(ingredient.id, name.trim(), reminderDate.trim());
    setIsEditing(false);
  }

  function submitKeep() {
    const nextErrors = validateKeepDate(keepDate, today);
    setErrors(nextErrors);
    if (hasFieldErrors(nextErrors)) {
      return;
    }
    onKeep(ingredient.id, keepDate.trim());
    setErrors({});
  }

  return (
    <li className="kitchen-ingredient-row">
      {isEditing ? (
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor={`edit-name-${ingredient.id}`}>Name</Label>
            <Input
              id={`edit-name-${ingredient.id}`}
              value={name}
              onChange={(event) => setName(event.target.value)}
              aria-invalid={Boolean(errors.name)}
            />
            {errors.name ? (
              <p className="text-sm text-destructive" role="alert">
                {errors.name}
              </p>
            ) : null}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`edit-date-${ingredient.id}`}>Reminder date</Label>
            <Input
              id={`edit-date-${ingredient.id}`}
              type="date"
              value={reminderDate}
              onChange={(event) => setReminderDate(event.target.value)}
              aria-invalid={Boolean(errors.reminderDate)}
            />
            <ReminderDateNote />
            {errors.reminderDate ? (
              <p className="text-sm text-destructive" role="alert">
                {errors.reminderDate}
              </p>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" onClick={saveEdit}>
              Save
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={cancelEdit}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground">{ingredient.name}</p>
            <p className="text-xs text-muted-foreground">
              {formatReminderLabel(ingredient.reminderDate, today)}
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-1.5">
            <Button type="button" variant="outline" size="xs" onClick={startEdit}>
              Edit
            </Button>
            <Button
              type="button"
              variant="outline"
              size="xs"
              onClick={() => onMarkUsed(ingredient.id)}
            >
              Mark used
            </Button>
          </div>
        </div>
      )}

      {mode === "review" && !isEditing ? (
        <div className="mt-2 space-y-2 border-t border-border pt-2">
          <p className="text-xs text-muted-foreground">
            Reminder date passed. Decide whether to keep cooking with this
            ingredient.
          </p>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <div className="min-w-0 flex-1 space-y-1.5">
              <Label htmlFor={`keep-date-${ingredient.id}`}>
                New reminder date
              </Label>
              <Input
                id={`keep-date-${ingredient.id}`}
                type="date"
                value={keepDate}
                onChange={(event) => setKeepDate(event.target.value)}
                aria-invalid={Boolean(errors.reminderDate)}
              />
              <ReminderDateNote />
            </div>
            <Button type="button" size="sm" onClick={submitKeep}>
              Keep
            </Button>
          </div>
          {errors.reminderDate ? (
            <p className="text-sm text-destructive" role="alert">
              {errors.reminderDate}
            </p>
          ) : null}
        </div>
      ) : null}
    </li>
  );
}
