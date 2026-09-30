import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { KitchenApp } from "@/components/KitchenApp";
import seedDinners from "@/data/dinners.json";
import seedIngredients from "@/data/ingredients.json";
import { INGREDIENTS_STORAGE_KEY } from "@/lib/ingredient-store";
import type { Dinner, SeedIngredient } from "@/lib/types";

const dinners = seedDinners as Dinner[];
const ingredientsSeed = seedIngredients as SeedIngredient[];

describe("KitchenApp", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    cleanup();
  });

  it("shows seeded dinners and ingredient groups on first visit", async () => {
    render(
      <KitchenApp seedIngredients={ingredientsSeed} dinners={dinners} />,
    );

    expect(
      await screen.findByRole("heading", { name: "Dinners" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Chicken and rice")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Review" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Use soon" })).toBeInTheDocument();
  });

  it("rejects blank ingredient input", async () => {
    const user = userEvent.setup();
    render(
      <KitchenApp seedIngredients={ingredientsSeed} dinners={dinners} />,
    );
    await screen.findByRole("heading", { name: "Dinners" });

    await user.click(screen.getByRole("button", { name: "Add ingredient" }));
    expect(await screen.findByText("Enter an ingredient name.")).toBeInTheDocument();
  });

  it("shows dinner steps after choosing a meal", async () => {
    const user = userEvent.setup();
    render(
      <KitchenApp seedIngredients={ingredientsSeed} dinners={dinners} />,
    );
    await screen.findByRole("heading", { name: "Dinners" });

    await user.click(screen.getAllByRole("button", { name: "Choose" })[0]);
    expect(
      screen.getByRole("heading", { name: "Chicken and rice", level: 2 }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Ingredients", level: 3 }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Rinse 1 cup rice/)).toBeInTheDocument();
  });

  it("shows simpler steps below originals after Make it simpler succeeds", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            ok: true,
            lines: ["Simmer rice first.", "Pan-fry chicken.", "Plate and eat."],
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      ),
    );

    const user = userEvent.setup();
    render(
      <KitchenApp seedIngredients={ingredientsSeed} dinners={dinners} />,
    );
    await screen.findByRole("heading", { name: "Dinners" });

    await user.click(screen.getAllByRole("button", { name: "Choose" })[0]);
    expect(screen.getByText(/Rinse 1 cup rice/)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Make it simpler" }));
    expect(
      await screen.findByRole("heading", { name: "Simpler way" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Simmer rice first.")).toBeInTheDocument();
    expect(screen.getByText(/Rinse 1 cup rice/)).toBeInTheDocument();

    vi.unstubAllGlobals();
  });

  it("shows AI suggestions after Suggest dinners succeeds", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn((input: RequestInfo) => {
        const url = typeof input === "string" ? input : input.url;
        if (url.includes("/api/dinners/suggest")) {
          return Promise.resolve(
            new Response(
              JSON.stringify({
                ok: true,
                suggestions: [
                  {
                    id: "ai-1",
                    name: "Quick spinach rice",
                    minutes: 18,
                    ingredientNames: ["Rice", "Spinach"],
                    steps: ["Cook rice.", "Stir in spinach."],
                  },
                ],
              }),
              { status: 200, headers: { "Content-Type": "application/json" } },
            ),
          );
        }
        return Promise.reject(new Error(`Unexpected fetch: ${url}`));
      }),
    );

    const user = userEvent.setup();
    render(
      <KitchenApp seedIngredients={ingredientsSeed} dinners={dinners} />,
    );
    await screen.findByRole("heading", { name: "Dinners" });
    expect(screen.getByText("Chicken and rice")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Suggest dinners" }));
    expect(
      await screen.findByText("Quick spinach rice"),
    ).toBeInTheDocument();

    vi.unstubAllGlobals();
  });

  it("persists a newly added ingredient after reload", async () => {
    const user = userEvent.setup();
    const { unmount } = render(
      <KitchenApp seedIngredients={ingredientsSeed} dinners={dinners} />,
    );
    await screen.findByRole("heading", { name: "Dinners" });

    await user.type(screen.getByLabelText("Name"), "Tofu");
    await user.type(screen.getByLabelText("Reminder date"), "2026-10-10");
    await user.click(screen.getByRole("button", { name: "Add ingredient" }));

    await waitFor(() => {
      expect(window.localStorage.getItem(INGREDIENTS_STORAGE_KEY)).toContain(
        "Tofu",
      );
    });

    unmount();
    render(
      <KitchenApp seedIngredients={ingredientsSeed} dinners={dinners} />,
    );
    expect(await screen.findByText("Tofu")).toBeInTheDocument();
  });
});
