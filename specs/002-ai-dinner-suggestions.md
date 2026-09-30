# Spec 002 — AI dinner suggestions

| Field | Value |
|---|---|
| **Status** | `shipped` |
| **Owner** | Junyao |
| **Started** | 2026-09-29 |
| **Done** | 2026-09-29 |
| **Strategy ref** | `PRD.md` § 4 (extends R7–R10; complements seeded dinners, does not replace R8) |

> Maya taps **Suggest dinners** and gets up to three simple ~20-minute meal ideas built only from ingredients she still has listed — with clear loading, errors, and no invented pantry items.

---

## 1. What ships when this is done

On `/`, the **Dinners** column keeps showing up to three **seeded** meals from `data/dinners.json` (same ranking as today). A new primary action **Suggest dinners** asks the server for up to **three** additional **AI-generated** dinners (~**20 minutes** each) based on her current **cookable** ingredient list. Each AI suggestion shows **name**, **estimated time**, **required ingredients**, and **short steps**. She can open one to read details in the same dinner-detail pattern as seeded meals; **choosing does not mark ingredients used**. If the model cannot propose anything honest from what she listed, she sees a **plain explanation** (not fake meals). **Make it simpler** (spec 001) works on **AI** dinner detail as well as seeded meals. Suggestions are **session-only** (not saved to localStorage or JSON; no Delete action). UI follows **Warm kitchen** tokens in `DESIGN.md`.

**Accuracy disclaimer (product copy, visible near AI results):** **Assumes cooking oil, salt, and black pepper** (users do not add these to the list). Other ingredients must match **names** on the list. The app does **not** verify **quantities** (for example “half an onion”) — see `PRD.md` § 8.

## 2. User stories

- **As Maya**, when none of the seeded dinners fit what I feel like eating, I need **Suggest dinners** so I get up to three quick ideas from what I still have listed, without opening a recipe site.
- **As Maya**, when I am trying to clear **Use soon** items, I need suggestions that **prefer those ingredients**, so dinner uses food that is coming due.
- **As Maya**, when my list is wrong or too sparse, I need the app to **say why** it cannot suggest meals instead of naming ingredients I do not have.
- **As Maya**, when I add, edit, mark used, or Keep an ingredient, I need old AI suggestions to **disappear**, so I am not looking at meals based on a stale list.

## 3. Surfaces

- Routes: `/` (Dinners column + shared dinner-detail region)
- Components: `components/KitchenApp.tsx` · `components/SuggestDinnersSection.tsx` · `components/SimplerDinnerHelper.tsx` (seeded only)
- Server: `app/api/dinners/suggest/route.ts` (POST)
- Lib: `lib/suggest-dinners.ts` · `lib/assumed-pantry.ts` · `lib/ingredient-fingerprint.ts` · `lib/openai.ts` · `lib/cookable-ingredients.ts` · `lib/ingredient-groups.ts` · `lib/simplify-dinner.ts` (shared step validation)
- Types: `lib/types.ts` — `AiDinnerSuggestion`, `IngredientSnapshotItem`
- Seed / matching unchanged: `data/dinners.json` · `lib/dinners.ts` · `lib/ingredient-store.ts`
- Env: `OPENAI_API_KEY` (server-only; never `NEXT_PUBLIC_*`)

## 4. Done criteria

Independently verifiable. Observable in the browser unless noted.

### Happy path and data rules

- [x] **Happy path:** With a typical seeded fridge (cookable chicken, rice, etc.), click **Suggest dinners** → button shows loading and is disabled → within a reasonable time up to **three** AI dinner cards (or rows) appear **below or beside** the existing seeded dinner list, each showing **name**, **~20 min** (or stated minutes ≤ 20), **ingredient names**, and at least **two** short steps when selected.
- [x] WHEN Maya clicks **Suggest dinners** THE server SHALL receive only **cookable** ingredients: `status === "available"` and `reminderDate` **today or later** (same rule as `isCookable` in `lib/ingredient-groups.ts`) THE server SHALL **NOT** include **Review** or **used** items.
- [x] THE prompt and post-validation SHALL instruct the model to **prioritize ingredients in Use soon** (today through today + `USE_SOON_WINDOW_DAYS`, same as `isUseSoon`) when choosing what each meal uses.
- [x] EVERY ingredient name in an AI suggestion SHALL be either on the **cookable** list (case-insensitive trim match) OR one of the **assumed staples**: cooking oil, salt, black pepper (`lib/assumed-pantry.ts`) THE system SHALL **NOT** allow other pantry items (for example soy sauce) unless the user listed them.
- [x] THE UI SHALL show near AI suggestions: **“Assumes cooking oil, salt, and black pepper.”**
- [x] **Make it simpler** (spec 001) SHALL allow the same three assumed staples in prompts and SHALL validate simplified steps with the same rules (cookable + assumed only).
- [x] EACH suggestion SHALL have `minutes` ≤ **20** and at least **two** step strings THE system SHALL reject or drop malformed model output rather than showing incomplete meals.
- [x] WHEN Maya selects an AI suggestion THE detail view SHALL show its name, ingredients, and steps THE system SHALL **NOT** mark any ingredient **used**.

### Seeded dinners and spec 001

- [x] THE seeded dinner list (`rankSuggestedDinners` from `data/dinners.json`) SHALL still render and behave as before (max three, same eligibility rules).
- [x] WHEN Maya selects a **seeded** dinner **Make it simpler** (spec 001) SHALL still work unchanged THE system SHALL NOT require AI suggestions to exist for simplify to work.
- [x] WHEN Maya selects an **AI-generated** dinner **Make it simpler** SHALL appear below original AI steps with the same loading, error, and stale-response behavior (spec 001 extension).

### Empty, impossible, and failure cases

- [x] IF there are **zero** cookable ingredients THEN **Suggest dinners** SHALL show a short inline message (for example that she needs available ingredients not in Review) and SHALL **NOT** call OpenAI.
- [x] IF the model returns no valid suggestions THE UI SHALL show a short explanation (for example that nothing simple fits what she listed) and SHALL **NOT** invent ingredient names or meals.
- [x] IF `OPENAI_API_KEY` is unset or the API call fails THEN THE UI SHALL show a clear inline error THE rest of the app (seeded dinners, ingredients, **Make it simpler** on seeded meals) SHALL keep working.

### Loading, concurrency, and stale responses

- [x] WHILE a suggest request is in flight THE **Suggest dinners** control SHALL show loading state and SHALL be **disabled** to prevent duplicate clicks.
- [x] WHEN the ingredient list **changes** (add, edit name/date, mark used, Keep from Review) THE UI SHALL **clear** displayed AI suggestions and any selected AI dinner until she clicks **Suggest dinners** again.
- [x] IF an ingredient change happens **during** an in-flight suggest request THE client SHALL **ignore** the response when it arrives (same pattern as `SimplerDinnerHelper` / `activeDinnerIdRef` — use a list **revision** or fingerprint ref).

### Safety, secrets, and design

- [x] AI suggestion text (prompt and displayed copy) SHALL **NOT** state or imply food is safe, unsafe, spoiled, or expired.
- [x] THE API key SHALL be read only in server code (`lib/openai.ts` / route) THE app SHALL NOT log, return, or expose the key in client bundles, network responses, or test output.
- [x] AI suggestion UI SHALL use Warm kitchen semantic tokens (`kitchen-panel`, `bg-primary`, `text-muted-foreground`, badges only for Use soon / Review — not for AI meals).

### Quality gate

- [x] `npm test` succeeds — new `lib/suggest-dinners.ts` covered with **mocked** OpenAI (no live API); `lib/` coverage floor maintained.
- [x] `npm run build` succeeds.

### Implementation note (server validation)

- [x] Post-parse validation rejects suggestions whose **steps** reference cookable ingredients not in that dish, or **forbidden pantry terms** (`lib/assumed-pantry.ts` — not the three assumed staples); rejects `minutes` > 20; each suggestion must include at least one **cookable** (non-staple) ingredient.

## 5. Constraints (must NOT)

- Do not expose `OPENAI_API_KEY` to the browser, tests, logs, or git; do not add `NEXT_PUBLIC_*` for OpenAI.
- Do not add a model env var; hardcode `gpt-4o-mini` in `lib/openai.ts`.
- Do not replace, remove, or re-rank seeded dinners out of `data/dinners.json`; do not write AI meals to seed JSON or localStorage.
- Do not change Review / Keep / used rules, `lib/ingredient-store.ts` persistence shape, or seeded `isDinnerEligible` matching except **reusing** cookable / Use soon helpers for the AI prompt.
- Do not break spec **001** (`app/api/dinners/simplify/route.ts`, `SimplerDinnerHelper`) — simplify stays tied to seeded `dinnerId` in `data/dinners.json` for this slice.
- Do not add a database, accounts, chat UI, or general recipe search.
- Do not make food-safety claims in UI, prompts, or displayed AI text.
- Do not write JSON files on the server.
- Do not invent a new visual style — follow `DESIGN.md`.
- Do not switch stacks or add `src/`.

**Do not change / keep working:** R1–R10 seeded flow, localStorage ingredient edits after refresh, **Make it simpler** on seeded and AI dinner detail.

## 6. Out of scope (for this spec)

- Persisting AI suggestions or simplified steps to localStorage / Neon (ephemeral session only).
- Using **Review** ingredients in AI prompts — cookable list only.
- Quantity tracking, unit conversion, or “do you have enough?” — `PRD.md` § 8; names only.
- Merging AI suggestions into the seeded `Dinner` type in `data/dinners.json`.
- Nutrition, allergies, shopping lists, photos, accounts — `PRD.md` non-goals.
- Replacing seeded dinners when AI returns results — both sources visible.

## 7. Dependencies

- **Blocking:** v1 home + seeded dinners (`shipped` in app) — `shipped`
- **Blocking:** spec **001** ai-dinner-simplify — `shipped` (must remain working)
- **Blocking:** `OPENAI_API_KEY` in server `.env` for live suggestions; app must load when key is missing (suggest action fails gracefully only)
- **Nice-to-have:** n/a

## 8. Open questions

| Question | Owner | Blocking? |
|---|---|---|
| Placement of AI list (stack under seeded vs separate **Suggested for you** heading) | Junyao | resolved — **Suggested for you** under seeded list |
| Exact empty-copy when model refuses vs parser rejects | Junyao | resolved — unified friendly messages in `lib/suggest-dinners.ts` |

## 9. Architecture notes

- Client POST `{ today, ingredients: snapshot[] }`; server recomputes cookable + Use soon via `lib/ingredient-groups.ts` / `lib/cookable-ingredients.ts`.
- OpenAI returns JSON `{ suggestions, unableReason }`; parsing and allowlist validation in `lib/suggest-dinners.ts`.
- Ingredient fingerprint (`lib/ingredient-fingerprint.ts`) clears AI UI on list change; in-flight requests compare fingerprint before applying results.
- AI suggestion ids assigned client-side with `crypto.randomUUID()` after successful response.

## 10. Domain & quality guardrails

- Stack and secrets: `.cursor/rules/workshop.mdc` — OpenAI server-only, single key env var.
- Folders: `.cursor/rules/folders.mdc` — `lib/suggest-dinners.ts`, `app/api/dinners/suggest/route.ts`.
- Look: `DESIGN.md` — Warm kitchen panels and buttons.
- Copy: **Assumes cooking oil, salt, and black pepper.** + other names from list; no quantity verification.

## 11. Test plan

- **`lib/suggest-dinners.test.ts`:** prompt, parse, step/pantry validation, minutes cap, safety, request validation, mocked `suggestDinnersWithOpenAI` (no network).
- **`lib/ingredient-fingerprint.test.ts`:** fingerprint changes on edit.
- **`KitchenApp.test.tsx`:** mocked `/api/dinners/suggest` → rows render; seeded list still present; simplify test unchanged.
- **`lib/assumed-pantry.test.ts`** — staple resolution, forbidden pantry vs assumed.
- **`npm test`** (66 tests, lib ~91% statements / ~85% branches) then **`npm run build`** — green 2026-09-29 (assumed staples update).

## 12. Change log

| Date | Change |
|---|---|
| 2026-09-29 | Spec created. Complements seeded dinners; AI suggestions ephemeral; quantity disclaimer. |
| 2026-09-29 | Shipped: server step + pantry validation; `POST /api/dinners/suggest`; UI **Suggested for you**; tests + build green. |
| 2026-09-29 | Assumed staples (cooking oil, salt, black pepper) in `lib/assumed-pantry.ts`; shared validation for suggest + simplify; UI note. |
| 2026-09-29 | **Make it simpler** enabled on AI dinner detail (spec 001 extension); server validates AI recipe on simplify POST. |
