# Spec 001 — AI simpler dinner steps

| Field | Value |
|---|---|
| **Status** | `shipped` |
| **Owner** | Junyao |
| **Started** | 2026-09-29 |
| **Done** | 2026-09-29 |
| **Strategy ref** | `PRD.md` § 4 (extends R10; new slice after v1 dinner detail) |

> After choosing a **seeded or AI-generated** dinner, the student can request a short, simpler way to cook it using cookable ingredients plus assumed staples — without replacing the original steps or making food-safety claims.

---

## 1. What ships when this is done

On the home screen, after Maya chooses a **seeded** dinner or an **AI-generated** dinner from **Suggested for you**, she still sees the meal’s **Ingredients** and **Steps**. **Make it simpler** sends the meal and her current ingredient snapshot to the server (seeded: `dinnerId` + cookable names; AI: full recipe + snapshot — server recomputes cookable and validates the recipe). Assumed staples **cooking oil, salt, black pepper** are always allowed. OpenAI returns a **short** simplification. The **Simpler way** panel appears **below** original steps; originals stay visible. Simplified text is ephemeral (not saved). Loading, errors, and stale-response guards apply when she switches dinners or edits ingredients.

## 2. User stories

- **As Maya**, when I have chosen a dinner and the steps feel like too much after class, I need a one-tap way to get a shorter, simpler version using what I still have, so I can start cooking without searching the web.
- **As Maya**, when the helper cannot respond, I need a plain error message and my original steps unchanged, so I am not blocked from cooking.
- **As Maya**, when I read the AI suggestion, I need it to stay brief and not tell me whether food is safe, so I can trust it as cooking help — not safety advice.

## 3. Surfaces

- Routes: `/` (existing — dinner detail region gains helper UI)
- Components: `components/KitchenApp.tsx` · `components/SimplerDinnerHelper.tsx`
- Server: `app/api/dinners/simplify/route.ts`
- Lib: `lib/openai.ts` · `lib/simplify-dinner.ts` · `lib/cookable-ingredients.ts`
- Seed / lib unchanged for matching: `data/dinners.json` · `lib/dinners.ts` · `lib/ingredient-groups.ts` · `lib/ingredient-store.ts`
- Env: `OPENAI_API_KEY` (server-only; never `NEXT_PUBLIC_*`)

## 4. Done criteria

Independently verifiable. At least one box each for empty/error input and API failure (this slice does not add new persistence fields).

- [x] **Happy path:** Choose **Chicken and rice** → original steps visible → click **Make it simpler** → within a few seconds a **Simpler way** (or equivalent label) block appears **below** original steps with at least two short lines of guidance; original steps text unchanged.
- [x] WHEN Maya clicks **Make it simpler** THE system SHALL send only the selected dinner’s id/name, original `steps`, and the list of **cookable** ingredient names (available, reminder date today or later — same rule as `lib/dinners.ts` / `isCookable`) THE system SHALL NOT include ingredients in **Review**.
- [x] THE simplified response SHALL stay short: at most **6** bullet or numbered lines and roughly **120 words** total (enforce in prompt; trim or reject overlong server-side if needed).
- [x] THE simplified response SHALL NOT state or imply that food is safe, unsafe, spoiled, or expired; prompt and post-check SHALL forbid safety verdicts.
- [x] IF `OPENAI_API_KEY` is unset or the API call fails THEN THE UI SHALL show a short inline error (for example “Could not get a simpler version. Use the steps above.”) and SHALL NOT replace or hide the original steps.
- [x] WHILE a request is in flight THE UI SHALL show a loading state on the action and SHALL NOT allow duplicate in-flight requests for the same dinner selection.
- [x] IF no dinner is selected THEN **Make it simpler** SHALL NOT appear (or SHALL be disabled with no server call).
- [x] IF Maya selects a different dinner after receiving a simplification THEN THE previous simplification SHALL clear until she requests again for the new dinner.
- [x] WHEN Maya chooses an **AI-generated** dinner THE system SHALL show **Make it simpler** THE server SHALL validate the submitted recipe against the current cookable list (plus assumed staples) before calling OpenAI.
- [x] WHEN the ingredient list changes THE simplification UI SHALL reset and in-flight simplify responses SHALL be ignored if the selection key no longer matches.
- [x] `npm test` succeeds (`lib/` coverage floor for new `lib/simplify-dinner.ts` and OpenAI fallback paths; no live API calls in tests).
- [x] `npm run build` succeeds.

## 5. Constraints (must NOT)

- Do not expose `OPENAI_API_KEY` to the browser or commit `.env`.
- Do not add a model env var; hardcode `gpt-4o-mini` in `lib/openai.ts`.
- Do not replace, delete, or overwrite seeded steps in `data/dinners.json` or in the UI — AI output is additive only.
- Do not change ingredient persistence (`lib/ingredient-store.ts`), Review/Keep rules, or dinner eligibility matching (`lib/dinners.ts`) except reusing existing helpers to build the ingredient list for the prompt.
- Do not add a database, accounts, chat history, or a general-purpose recipe chat — one action, one short response per request.
- Do not make food-safety claims in UI copy, prompts, or displayed AI text.
- Do not write JSON files on the server.
- Do not invent a new visual style — follow `DESIGN.md` (Warm kitchen tokens).
- Do not switch stacks or add `src/`.

**Do not change / keep working (from `PRD.md` v1):** add/edit ingredients, Use soon / Review / Keep, dinner list (max 3), choose dinner detail, localStorage ingredient edits after refresh.

## 6. Out of scope (for this spec)

- Free-form chat (“ask anything about cooking”) — future spec, unassigned.
- Simplifying before a dinner is chosen — this spec requires an active dinner selection.
- Using **Review** ingredients in the AI suggestion — out of scope; cookable list only.
- Saving AI responses to localStorage or Neon — ephemeral per session/view.
- Nutrition, allergies, substitutions that require shopping — `PRD.md` non-goals.
- Push notifications or email — `PRD.md` non-goals.

## 7. Dependencies

- **Blocking:** v1 dinner detail on `/` (R10 shipped in current app) — `shipped`
- **Blocking:** `OPENAI_API_KEY` in `.env` on the machine that runs the server route (local dev / Vercel). App must still load when the key is missing; only the helper action fails gracefully.
- **Nice-to-have:** n/a

## 8. Open questions

| Question | Owner | Blocking? |
|---|---|---|
| Exact button label (**Make it simpler** vs **Simpler with what I have**) | Junyao | no — default **Make it simpler** in build |
| n/a — display pattern (below original steps) | Junyao | resolved 2026-09-29 |

## 9. Architecture notes

- **Seeded:** client sends `{ dinnerId, cookableIngredientNames[] }`; server loads steps from `data/dinners.json`.
- **AI:** client sends `{ aiDinner, today, ingredients[] }`; server recomputes cookable names and validates `aiDinner` via `validateSubmittedAiMealForSimplify` (same rules as suggest, including assumed staples).
- `SimplerDinnerHelper` uses a `selectionKey` of dinner id + ingredient fingerprint for stale guards.
- Server calls OpenAI via `lib/openai.ts`; parsing and length/safety guardrails live in `lib/simplify-dinner.ts` so tests do not need the network.
- On missing key: server returns a structured error; client shows inline message. No throw on page load.
- Model: `gpt-4o-mini` only.

## 10. Domain & quality guardrails

- Stack and secrets: `.cursor/rules/workshop.mdc` — OpenAI server-only, single key env var.
- Folders: `.cursor/rules/folders.mdc` — `lib/openai.ts`, route or action under `app/`.
- Look: `DESIGN.md` — helper block uses `kitchen-panel` / semantic tokens; loading and error use existing destructive/muted patterns.
- Copy: Reminder dates remain nudges only; AI helper must not contradict “app does not decide food safety.”

## 11. Test plan

- **`lib/simplify-dinner.ts`:** build prompt includes dinner name, ~20 min target, cookable ingredient list, and “no safety claims”; parse/validate response length; branch when API returns empty or overlong text.
- **`lib/openai.ts`:** not required to hit the network — mock at route/action or simplify layer.
- **Route/action:** with key unset, returns error shape without crashing build; with mocked OpenAI, returns simplified text.
- **Screen (≤5):** dinner selected → button visible → click → simplified block below originals; API error → inline message, originals still visible; change selected dinner → prior simplification cleared.
- **`npm test`** then **`npm run build`** before marking `shipped`.
- Walk **PRD.md** R10 (original steps still shown) plus this spec § 4 — no regression on choose-dinner flow.

## 12. Change log

| Date | Change |
|---|---|
| 2026-09-29 | Spec created. Display: keep original steps; AI block below. |
| 2026-09-29 | Shipped: API route, helper UI, lib tests + screen tests; `npm test` (34 tests, lib coverage ~88%) and `npm run build` green. |
| 2026-09-29 | Extended simplify to AI-selected dinners; server validates AI recipe + cookable snapshot; assumed staples; fingerprint stale guard. |
| 2026-09-30 | Spec 004: JSON simplify response, ≤4 steps / ~80 words, effort validation, improvement sentence under **Simpler way**, one retry. |
