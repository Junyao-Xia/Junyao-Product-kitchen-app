"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { listCookableIngredientNames } from "@/lib/cookable-ingredients";
import { buildIngredientFingerprint } from "@/lib/ingredient-fingerprint";
import { ASSUMED_PANTRY_NOTE } from "@/lib/assumed-pantry";
import { SUGGEST_NO_COOKABLE_MESSAGE } from "@/lib/suggest-dinners";
import type { AiDinnerSuggestion, Ingredient } from "@/lib/types";

type SuggestDinnersSectionProps = {
  ingredients: Ingredient[];
  today: string;
  selectedAiId: string | null;
  onSelectAi: (suggestion: AiDinnerSuggestion) => void;
};

export function SuggestDinnersSection({
  ingredients,
  today,
  selectedAiId,
  onSelectAi,
}: SuggestDinnersSectionProps) {
  const [suggestions, setSuggestions] = useState<AiDinnerSuggestion[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const fingerprintRef = useRef(buildIngredientFingerprint(ingredients));
  const cookableNames = listCookableIngredientNames(ingredients, today);

  useEffect(() => {
    const nextFingerprint = buildIngredientFingerprint(ingredients);
    if (nextFingerprint !== fingerprintRef.current) {
      fingerprintRef.current = nextFingerprint;
      setSuggestions([]);
      setError(null);
      setLoading(false);
    }
  }, [ingredients]);

  async function handleSuggest() {
    if (loading) {
      return;
    }

    if (cookableNames.length === 0) {
      setError(SUGGEST_NO_COOKABLE_MESSAGE);
      setSuggestions([]);
      return;
    }

    const requestFingerprint = fingerprintRef.current;
    setLoading(true);
    setError(null);
    setSuggestions([]);

    try {
      const response = await fetch("/api/dinners/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          today,
          ingredients: ingredients.map((item) => ({
            id: item.id,
            name: item.name,
            reminderDate: item.reminderDate,
            status: item.status,
          })),
        }),
      });

      if (requestFingerprint !== fingerprintRef.current) {
        return;
      }

      const payload = (await response.json()) as {
        ok: boolean;
        suggestions?: AiDinnerSuggestion[];
        error?: string;
      };

      if (requestFingerprint !== fingerprintRef.current) {
        return;
      }

      if (!payload.ok || !payload.suggestions?.length) {
        setError(payload.error ?? "Could not load dinner suggestions.");
        return;
      }

      const withIds = payload.suggestions.map((item) => ({
        ...item,
        id: crypto.randomUUID(),
      }));
      setSuggestions(withIds);
    } catch {
      if (requestFingerprint === fingerprintRef.current) {
        setError("Could not load dinner suggestions. Try again or use the dinners above.");
      }
    } finally {
      if (requestFingerprint === fingerprintRef.current) {
        setLoading(false);
      }
    }
  }

  return (
    <section aria-labelledby="ai-dinners-heading" className="mt-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2
          id="ai-dinners-heading"
          className="text-lg font-semibold text-foreground md:text-xl"
        >
          Suggested for you
        </h2>
        <Button
          type="button"
          size="sm"
          onClick={handleSuggest}
          disabled={loading}
          aria-busy={loading}
        >
          {loading ? "Finding ideas…" : "Suggest dinners"}
        </Button>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        {ASSUMED_PANTRY_NOTE} Other ingredients must match names on your list.
        Amounts (for example half an onion) are not checked.
      </p>

      {error ? (
        <p className="mt-3 text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      {suggestions.length > 0 ? (
        <ul className="mt-3 space-y-2">
          {suggestions.map((dinner) => (
            <li key={dinner.id}>
              <Card
                className={
                  selectedAiId === dinner.id
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
                      {dinner.minutes} min · {dinner.ingredientNames.join(", ")}
                    </p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant={selectedAiId === dinner.id ? "default" : "outline"}
                    onClick={() => onSelectAi(dinner)}
                  >
                    Choose
                  </Button>
                </CardHeader>
              </Card>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
