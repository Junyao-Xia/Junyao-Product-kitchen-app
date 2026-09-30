import seedDinners from "@/data/dinners.json";
import {
  findDinnerById,
  isSimplifyRequestFailure,
  simplifyMealWithOpenAI,
  validateSimplifyRequest,
  SIMPLIFY_USER_ERROR,
} from "@/lib/simplify-dinner";
import type { Dinner } from "@/lib/types";

const dinners = seedDinners as Dinner[];

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: SIMPLIFY_USER_ERROR }, { status: 400 });
  }

  const validated = validateSimplifyRequest(body);
  if (isSimplifyRequestFailure(validated)) {
    console.error("[api/dinners/simplify] request validation failed", {
      status: 400,
    });
    return Response.json(validated, { status: 400 });
  }

  if (validated.type === "ai") {
    const result = await simplifyMealWithOpenAI(
      validated.meal,
      validated.cookableIngredientNames,
    );
    if (!result.ok) {
      console.error("[api/dinners/simplify] ai meal failed", {
        status: 503,
        reason: result.reason ?? "unknown",
      });
      return Response.json(
        { ok: false, error: result.error },
        { status: 503 },
      );
    }
    return Response.json(result);
  }

  const dinner = findDinnerById(dinners, validated.dinnerId);
  if (!dinner) {
    return Response.json(
      { ok: false, error: SIMPLIFY_USER_ERROR },
      { status: 404 },
    );
  }

  const result = await simplifyMealWithOpenAI(
    dinner,
    validated.cookableIngredientNames,
  );
  if (!result.ok) {
    console.error("[api/dinners/simplify] seeded meal failed", {
      status: 503,
      reason: result.reason ?? "unknown",
    });
    return Response.json({ ok: false, error: result.error }, { status: 503 });
  }

  return Response.json(result);
}
