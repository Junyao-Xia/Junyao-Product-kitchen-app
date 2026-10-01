import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SimplerDinnerHelper } from "@/components/SimplerDinnerHelper";
import type { Ingredient } from "@/lib/types";

const ingredients: Ingredient[] = [
  {
    id: "1",
    name: "Chicken",
    reminderDate: "2026-09-30",
    status: "available",
  },
];

describe("SimplerDinnerHelper", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("ignores a stale response when selection changes during the request", async () => {
    const user = userEvent.setup();
    let resolveFetch: (value: Response) => void = () => {};
    const fetchPromise = new Promise<Response>((resolve) => {
      resolveFetch = resolve;
    });

    vi.stubGlobal(
      "fetch",
      vi.fn(() => fetchPromise),
    );

    const { rerender } = render(
      <SimplerDinnerHelper
        target={{ type: "seeded", dinnerId: "dinner-a" }}
        ingredients={ingredients}
        today="2026-09-29"
        cookableIngredientNames={["Chicken"]}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Make it simpler" }));
    expect(screen.getByRole("button", { name: "Working on it…" })).toBeDisabled();

    rerender(
      <SimplerDinnerHelper
        target={{ type: "seeded", dinnerId: "dinner-b" }}
        ingredients={ingredients}
        today="2026-09-29"
        cookableIngredientNames={["Chicken"]}
      />,
    );

    resolveFetch(
      new Response(
        JSON.stringify({
          ok: true,
          lines: ["Stale step one.", "Stale step two."],
          improvement: "Uses one pan instead of two.",
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );

    await waitFor(() => {
      expect(globalThis.fetch).toHaveBeenCalled();
    });

    expect(screen.queryByText("Stale step one.")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Make it simpler" }),
    ).toBeEnabled();
  });

  it("posts AI dinner payload with ingredient snapshot", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          ok: true,
          lines: ["Step one.", "Step two."],
          improvement: "Uses one pan instead of two.",
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    const user = userEvent.setup();
    render(
      <SimplerDinnerHelper
        target={{
          type: "ai",
          dinner: {
            id: "ai-1",
            name: "Quick chicken",
            minutes: 18,
            ingredientNames: ["Chicken"],
            steps: ["Cook chicken.", "Serve."],
          },
        }}
        ingredients={ingredients}
        today="2026-09-29"
        cookableIngredientNames={["Chicken"]}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Make it simpler" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalled();
    });

    const init = fetchMock.mock.calls[0][1] as RequestInit;
    const body = JSON.parse(String(init.body)) as {
      aiDinner?: { name: string };
      dinnerId?: string;
    };
    expect(body.aiDinner?.name).toBe("Quick chicken");
    expect(body.dinnerId).toBeUndefined();

    vi.unstubAllGlobals();
  });

  it("shows the improvement sentence below simpler steps", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            ok: true,
            lines: ["Cook everything in one skillet.", "Serve."],
            improvement: "Uses one pan instead of two.",
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      ),
    );

    const user = userEvent.setup();
    render(
      <SimplerDinnerHelper
        target={{ type: "seeded", dinnerId: "dinner-a" }}
        ingredients={ingredients}
        today="2026-09-29"
        cookableIngredientNames={["Chicken"]}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Make it simpler" }));
    expect(
      await screen.findByText("Uses one pan instead of two."),
    ).toBeInTheDocument();

    vi.unstubAllGlobals();
  });
});
