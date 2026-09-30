import {
  isSuggestRequestFailure,
  snapshotToIngredients,
  suggestDinnersWithOpenAI,
  SUGGEST_USER_ERROR,
  validateSuggestRequest,
} from "@/lib/suggest-dinners";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: SUGGEST_USER_ERROR }, { status: 400 });
  }

  const validated = validateSuggestRequest(body);
  if (isSuggestRequestFailure(validated)) {
    return Response.json(validated, { status: 400 });
  }

  const ingredients = snapshotToIngredients(validated.ingredients);
  const result = await suggestDinnersWithOpenAI(ingredients, validated.today);

  if (!result.ok) {
    const status =
      result.error.includes("not in Review") || result.error.includes("Nothing simple")
        ? 422
        : 503;
    return Response.json(result, { status });
  }

  return Response.json(result);
}
