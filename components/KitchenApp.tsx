"use client";

import { useEffect, useMemo, useState } from "react";
import { IngredientItem } from "@/components/IngredientItem";
import { KitchenPanel } from "@/components/KitchenPanel";
import { SimplerDinnerHelper } from "@/components/SimplerDinnerHelper";
import { SuggestDinnersSection } from "@/components/SuggestDinnersSection";
import {
  AddIngredientPanelDecor,
  KitchenIllustration,
} from "@/components/KitchenIllustration";
import { QuickSelectMeats } from "@/components/QuickSelectMeats";
import { ReminderDateNote } from "@/components/ReminderDateNote";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toISODate } from "@/lib/dates";
import { listCookableIngredientNames } from "@/lib/cookable-ingredients";
import { buildIngredientFingerprint } from "@/lib/ingredient-fingerprint";
import { rankSuggestedDinners } from "@/lib/dinners";
import {
  createIngredientId,
  loadOrInitializeIngredients,
  writeStoredIngredients,
} from "@/lib/ingredient-store";
import { partitionIngredients } from "@/lib/ingredient-groups";
import type {
  AiDinnerSuggestion,
  Dinner,
  Ingredient,
  SeedIngredient,
} from "@/lib/types";
import {
  hasFieldErrors,
  validateAddIngredient,
} from "@/lib/validate-ingredient";

type KitchenAppProps = {
  seedIngredients: SeedIngredient[];
  dinners: Dinner[];
};

export function KitchenApp({ seedIngredients, dinners }: KitchenAppProps) {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [ready, setReady] = useState(false);
  const [selectedDinnerId, setSelectedDinnerId] = useState<string | null>(null);
  const [selectedAiDinner, setSelectedAiDinner] =
    useState<AiDinnerSuggestion | null>(null);
  const [newName, setNewName] = useState("");
  const [newReminderDate, setNewReminderDate] = useState("");
  const [addErrors, setAddErrors] = useState<{
    name?: string;
    reminderDate?: string;
  }>({});

  const today = useMemo(() => toISODate(new Date()), []);

  useEffect(() => {
    const loaded = loadOrInitializeIngredients(
      window.localStorage,
      seedIngredients,
      today,
    );
    setIngredients(loaded);
    setReady(true);
  }, [seedIngredients, today]);

  useEffect(() => {
    if (!ready) {
      return;
    }
    writeStoredIngredients(window.localStorage, ingredients);
  }, [ingredients, ready]);

  const { review, useSoon, other } = partitionIngredients(ingredients, today);
  const suggested = rankSuggestedDinners(dinners, ingredients, today);
  const selectedDinner =
    suggested.find((dinner) => dinner.id === selectedDinnerId) ??
    dinners.find((dinner) => dinner.id === selectedDinnerId) ??
    null;

  const hasAvailable = ingredients.some((item) => item.status === "available");
  const cookableIngredientNames = useMemo(
    () => listCookableIngredientNames(ingredients, today),
    [ingredients, today],
  );

  function updateIngredients(updater: (current: Ingredient[]) => Ingredient[]) {
    setIngredients((current) => updater(current));
    setSelectedAiDinner(null);
  }

  function selectSeededDinner(dinnerId: string) {
    setSelectedDinnerId(dinnerId);
    setSelectedAiDinner(null);
  }

  function selectAiDinner(suggestion: AiDinnerSuggestion) {
    setSelectedDinnerId(null);
    setSelectedAiDinner(suggestion);
  }

  function handleAddIngredient(event: React.FormEvent) {
    event.preventDefault();
    const errors = validateAddIngredient(
      newName,
      newReminderDate,
      ingredients,
    );
    setAddErrors(errors);
    if (hasFieldErrors(errors)) {
      return;
    }
    const ingredient: Ingredient = {
      id: createIngredientId(),
      name: newName.trim(),
      reminderDate: newReminderDate.trim(),
      status: "available",
    };
    updateIngredients((current) => [...current, ingredient]);
    setNewName("");
    setNewReminderDate("");
    setAddErrors({});
  }

  function handleSaveEdit(id: string, name: string, reminderDate: string) {
    updateIngredients((current) =>
      current.map((item) =>
        item.id === id ? { ...item, name, reminderDate } : item,
      ),
    );
  }

  function handleMarkUsed(id: string) {
    updateIngredients((current) =>
      current.map((item) =>
        item.id === id ? { ...item, status: "used" } : item,
      ),
    );
  }

  function handleKeep(id: string, reminderDate: string) {
    updateIngredients((current) =>
      current.map((item) =>
        item.id === id ? { ...item, reminderDate, status: "available" } : item,
      ),
    );
  }

  if (!ready) {
    return (
      <p className="text-muted-foreground" aria-live="polite">
        Loading your ingredients…
      </p>
    );
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-[2rem] md:leading-tight">
            What can you cook tonight?
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-foreground">
            After class, see a twenty-minute dinner from the food you already
            have, using whatever should be used soon first.
          </p>
        </div>
        <div className="flex shrink-0 justify-center sm:justify-end" aria-hidden>
          <KitchenIllustration
            src="/illustrations/fridge-hero.svg"
            alt=""
            width={128}
            height={112}
            className="kitchen-illustration h-20 w-auto sm:h-24 md:h-28"
          />
        </div>
      </header>

      <div className="grid gap-8 lg:grid-cols-2 lg:items-start lg:gap-10">
        <div className="space-y-6">
          <section aria-labelledby="dinners-heading">
            <h2
              id="dinners-heading"
              className="text-lg font-semibold text-foreground md:text-xl"
            >
              Dinners
            </h2>
            {suggested.length > 0 ? (
              <ul className="mt-3 space-y-2">
                {suggested.map((dinner) => (
                  <li key={dinner.id}>
                    <Card
                      className={
                        selectedDinnerId === dinner.id
                          ? "border-primary ring-1 ring-primary/20"
                          : undefined
                      }
                    >
                      <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0 px-4 py-3">
                        <div className="min-w-0">
                          <CardTitle className="text-base font-semibold">
                            {dinner.name}
                          </CardTitle>
                          <p className="text-sm text-muted-foreground">
                            {dinner.minutes} min ·{" "}
                            {dinner.ingredientNames.join(", ")}
                          </p>
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          variant={
                            selectedDinnerId === dinner.id
                              ? "default"
                              : "outline"
                          }
                          onClick={() => selectSeededDinner(dinner.id)}
                        >
                          Choose
                        </Button>
                      </CardHeader>
                    </Card>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {hasAvailable
                  ? "No 20-minute dinners match what you have right now. Mark ingredients used or add what is in your fridge."
                  : "Add ingredients after your shop to see dinner ideas here."}
              </p>
            )}

            <SuggestDinnersSection
              key={buildIngredientFingerprint(ingredients)}
              ingredients={ingredients}
              today={today}
              selectedAiId={selectedAiDinner?.id ?? null}
              onSelectAi={selectAiDinner}
            />
          </section>

          {selectedAiDinner ? (
            <KitchenPanel aria-labelledby="ai-dinner-detail-heading">
              <h2
                id="ai-dinner-detail-heading"
                className="text-lg font-semibold md:text-xl"
              >
                {selectedAiDinner.name}
              </h2>
              <p className="text-sm text-muted-foreground">
                {selectedAiDinner.minutes} min · suggested for your list
              </p>
              <h3 className="mt-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Ingredients
              </h3>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-foreground">
                {selectedAiDinner.ingredientNames.map((name) => (
                  <li key={name}>{name}</li>
                ))}
              </ul>
              <h3 className="mt-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Steps
              </h3>
              <ol className="mt-2 list-decimal space-y-2 pl-5 leading-relaxed text-foreground">
                {selectedAiDinner.steps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
              <p className="mt-4 text-sm text-muted-foreground">
                Mark ingredients used after you cook. Choosing a dinner does not
                remove them from your list.
              </p>
              <SimplerDinnerHelper
                target={{ type: "ai", dinner: selectedAiDinner }}
                ingredients={ingredients}
                today={today}
                cookableIngredientNames={cookableIngredientNames}
              />
            </KitchenPanel>
          ) : selectedDinner ? (
            <KitchenPanel aria-labelledby="dinner-detail-heading">
              <h2
                id="dinner-detail-heading"
                className="text-lg font-semibold md:text-xl"
              >
                {selectedDinner.name}
              </h2>
              <p className="text-sm text-muted-foreground">
                {selectedDinner.minutes} min
              </p>
              <h3 className="mt-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Ingredients
              </h3>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-foreground">
                {selectedDinner.ingredientNames.map((name) => (
                  <li key={name}>{name}</li>
                ))}
              </ul>
              <h3 className="mt-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Steps
              </h3>
              <ol className="mt-2 list-decimal space-y-2 pl-5 leading-relaxed text-foreground">
                {selectedDinner.steps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
              <p className="mt-4 text-sm text-muted-foreground">
                Mark ingredients used after you cook. Choosing a dinner does not
                remove them from your list.
              </p>
              <SimplerDinnerHelper
                target={{ type: "seeded", dinnerId: selectedDinner.id }}
                ingredients={ingredients}
                today={today}
                cookableIngredientNames={cookableIngredientNames}
              />
            </KitchenPanel>
          ) : null}
        </div>

        <div className="space-y-6">
          <section aria-labelledby="add-heading">
            <h2
              id="add-heading"
              className="text-lg font-semibold text-foreground md:text-xl"
            >
              Add ingredient
            </h2>
            <AddIngredientPanelDecor>
            <form
              onSubmit={handleAddIngredient}
              className="kitchen-panel space-y-4 p-4 md:p-5"
            >
              <QuickSelectMeats
                ingredients={ingredients}
                selectedName={newName}
                onSelect={(name) => {
                  setNewName(name);
                  setAddErrors((current) =>
                    current.name ? { ...current, name: undefined } : current,
                  );
                }}
              />
              <div className="space-y-2">
                <Label htmlFor="new-name">Name</Label>
                <Input
                  id="new-name"
                  value={newName}
                  onChange={(event) => setNewName(event.target.value)}
                  aria-invalid={Boolean(addErrors.name)}
                />
                {addErrors.name ? (
                  <p className="text-sm text-destructive" role="alert">
                    {addErrors.name}
                  </p>
                ) : null}
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-date">Reminder date</Label>
                <Input
                  id="new-date"
                  type="date"
                  value={newReminderDate}
                  onChange={(event) => setNewReminderDate(event.target.value)}
                  aria-invalid={Boolean(addErrors.reminderDate)}
                />
                <ReminderDateNote />
                {addErrors.reminderDate ? (
                  <p className="text-sm text-destructive" role="alert">
                    {addErrors.reminderDate}
                  </p>
                ) : null}
              </div>
              <Button type="submit" className="w-full sm:w-auto">
                Add ingredient
              </Button>
            </form>
            </AddIngredientPanelDecor>
          </section>

          {!hasAvailable ? (
            <p className="kitchen-panel p-4 text-sm leading-relaxed text-muted-foreground">
              No ingredients left on your list. Add what is in your fridge after
              your next shop.
            </p>
          ) : (
            <>
              {useSoon.length > 0 ? (
                <IngredientSection
                  title="Use soon"
                  badge="useSoon"
                  items={useSoon}
                  today={today}
                  mode="useSoon"
                  onSaveEdit={handleSaveEdit}
                  onMarkUsed={handleMarkUsed}
                  onKeep={handleKeep}
                />
              ) : null}
              {review.length > 0 ? (
                <IngredientSection
                  title="Review"
                  badge="review"
                  items={review}
                  today={today}
                  mode="review"
                  onSaveEdit={handleSaveEdit}
                  onMarkUsed={handleMarkUsed}
                  onKeep={handleKeep}
                />
              ) : null}
              {other.length > 0 ? (
                <IngredientSection
                  title="Ingredients"
                  items={other}
                  today={today}
                  mode="other"
                  onSaveEdit={handleSaveEdit}
                  onMarkUsed={handleMarkUsed}
                  onKeep={handleKeep}
                />
              ) : null}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

type IngredientSectionProps = {
  title: string;
  badge?: "useSoon" | "review";
  items: Ingredient[];
  today: string;
  mode: "useSoon" | "review" | "other";
  onSaveEdit: (id: string, name: string, reminderDate: string) => void;
  onMarkUsed: (id: string) => void;
  onKeep: (id: string, reminderDate: string) => void;
};

function sectionHeadingId(title: string): string {
  return `${title.toLowerCase().replace(/\s+/g, "-")}-heading`;
}

function IngredientSection({
  title,
  badge,
  items,
  today,
  mode,
  onSaveEdit,
  onMarkUsed,
  onKeep,
}: IngredientSectionProps) {
  const headingId = sectionHeadingId(title);

  return (
    <section aria-labelledby={headingId}>
      <div className="flex flex-wrap items-center gap-2">
        <h2
          id={headingId}
          className="text-lg font-semibold text-foreground md:text-xl"
        >
          {title}
        </h2>
        {badge ? <StatusBadge variant={badge} /> : null}
      </div>
      <ul className="mt-2 space-y-2">
        {items.map((ingredient) => (
          <IngredientItem
            key={ingredient.id}
            ingredient={ingredient}
            today={today}
            mode={mode}
            onSaveEdit={onSaveEdit}
            onMarkUsed={onMarkUsed}
            onKeep={onKeep}
          />
        ))}
      </ul>
    </section>
  );
}
