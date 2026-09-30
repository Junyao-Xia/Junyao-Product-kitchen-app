"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { buildIngredientFingerprint } from "@/lib/ingredient-fingerprint";
import type { AiDinnerSuggestion, Ingredient } from "@/lib/types";

export type SimplerDinnerTarget =
  | { type: "seeded"; dinnerId: string }
  | { type: "ai"; dinner: AiDinnerSuggestion };

type SimplerDinnerHelperProps = {
  target: SimplerDinnerTarget;
  ingredients: Ingredient[];
  today: string;
  cookableIngredientNames: string[];
};

export function SimplerDinnerHelper({
  target,
  ingredients,
  today,
  cookableIngredientNames,
}: SimplerDinnerHelperProps) {
  const [lines, setLines] = useState<string[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const ingredientFingerprint = useMemo(
    () => buildIngredientFingerprint(ingredients),
    [ingredients],
  );

  const selectionKey = useMemo(() => {
    const dinnerPart =
      target.type === "seeded" ? target.dinnerId : target.dinner.id;
    return `${target.type}:${dinnerPart}:${ingredientFingerprint}`;
  }, [target, ingredientFingerprint]);

  const activeSelectionKeyRef = useRef(selectionKey);

  useEffect(() => {
    activeSelectionKeyRef.current = selectionKey;
    setLines(null);
    setError(null);
    setLoading(false);
  }, [selectionKey]);

  async function handleSimplify() {
    if (loading) {
      return;
    }

    const requestKey = selectionKey;
    setLoading(true);
    setError(null);
    setLines(null);

    const body =
      target.type === "seeded"
        ? {
            dinnerId: target.dinnerId,
            cookableIngredientNames,
          }
        : {
            aiDinner: {
              name: target.dinner.name,
              minutes: target.dinner.minutes,
              ingredientNames: target.dinner.ingredientNames,
              steps: target.dinner.steps,
            },
            today,
            ingredients: ingredients.map((item) => ({
              id: item.id,
              name: item.name,
              reminderDate: item.reminderDate,
              status: item.status,
            })),
          };

    try {
      const response = await fetch("/api/dinners/simplify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (requestKey !== activeSelectionKeyRef.current) {
        return;
      }

      const payload = (await response.json()) as {
        ok: boolean;
        lines?: string[];
        error?: string;
      };

      if (requestKey !== activeSelectionKeyRef.current) {
        return;
      }

      if (!payload.ok || !payload.lines?.length) {
        setError(
          payload.error ?? "Could not get a simpler version. Use the steps above.",
        );
        return;
      }

      setLines(payload.lines);
    } catch {
      if (requestKey === activeSelectionKeyRef.current) {
        setError("Could not get a simpler version. Use the steps above.");
      }
    } finally {
      if (requestKey === activeSelectionKeyRef.current) {
        setLoading(false);
      }
    }
  }

  return (
    <div className="mt-4 border-t border-border pt-4">
      <Button
        type="button"
        size="sm"
        onClick={handleSimplify}
        disabled={loading}
        aria-busy={loading}
      >
        {loading ? "Working on it…" : "Make it simpler"}
      </Button>

      {error ? (
        <p className="mt-3 text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      {lines && lines.length > 0 ? (
        <div className="kitchen-panel mt-4 p-4">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Simpler way
          </h3>
          <ol className="mt-2 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-foreground">
            {lines.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ol>
        </div>
      ) : null}
    </div>
  );
}
