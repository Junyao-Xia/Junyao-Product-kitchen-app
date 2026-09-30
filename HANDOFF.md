# Quick dinners from what you have — Handoff

> **How a new AI uses this file.** Open a fresh chat and paste:
>
> *Read `HANDOFF.md` first. Follow the reading order in § 3. Then do the Next session pickup — do not rebuild anything already shipped.*

> **Snapshot date:** 2026-09-29 (session — simplify water-validation fix; manual simplify confirmed)
> **Next session pickup:** Ask Junyao for the next slice (deploy, Neon, or new PRD/spec); read `PRD.md` § 4 and `specs/README.md`.

> This is the living state snapshot. A fresh agent (or you, next week) reads it
> first and re-orients in five minutes instead of re-deriving state. **Sections
> 1–3, 6, 11, 12 are contracts — they rarely move. Sections 4, 5, 8 are state —
> updated every wrap.**

---

## 1. What this is (60 seconds)

**Quick dinners from what you have** — fridge list + up to three ~20-minute dinners from what Maya still has.

- **Product:** Track ingredients (Use soon / Review / Keep), see **seeded** ranked dinners, tap **Suggest dinners** for up to three **AI** meals, open steps; **Make it simpler** on **seeded and AI** dinners (ephemeral — not saved).
- **Stack:** Next.js (App Router) · React · TypeScript · Tailwind · shadcn/ui · **Warm kitchen** (`DESIGN.md`) · seed JSON + localStorage · OpenAI server-only (`gpt-4o-mini` in `lib/openai.ts`) · Neon not added.
- **Architectural rule (load-bearing):** Records live in `data/*.json` (seed) and localStorage (user-created). AI suggestions are **ephemeral** (not persisted).

## 2. Non-negotiable rules

These three files are the rails. Do not add extra `.mdc` files, Playwright, or CI unless the student asks. Do not lower the `lib/` coverage floor.

| File | Enforces |
|---|---|
| `.cursor/rules/workshop.mdc` | Stack, seed-JSON-first data, secrets in `.env`, server-side API calls, product rules in `lib/` |
| `PRD.md` | Scope contract — P0s, non-goals, acceptance criteria |
| `DESIGN.md` | Look & feel — theme tokens in `app/globals.css` |

## 3. Reading order for a fresh agent

1. This file.
2. `.cursor/rules/workshop.mdc`
3. `PRD.md`
4. `DESIGN.md`
5. `specs/README.md`
6. `data/*.json`

## 4. Current state of the work — *updated each wrap*

- Specs: **2 shipped** · 0 building · 0 planned (`specs/README.md`).

### Shipped capabilities

- **v1 home (`/`):** ingredient groups, add/edit → localStorage, up to three **seeded** dinners (`lib/dinners.ts`), dinner detail with steps.
- **Spec 001 — Make it simpler:** `POST /api/dinners/simplify` · **seeded** `{ dinnerId, cookableIngredientNames }` or **AI** `{ aiDinner, today, ingredients[] }` — server recomputes cookable and validates AI recipe before OpenAI · **Simpler way** below original steps · `SimplerDinnerHelper.tsx` (`selectionKey` = dinner + ingredient fingerprint) · assumed staples (oil, salt, pepper) in prompts + step validation · **water** allowed in simplified steps as implicit cooking medium (`IMPLICIT_STEP_TERMS` in `lib/assumed-pantry.ts`) — not listed on the fridge · failed simplify responses log `reason` server-side (never the API key).
- **Spec 002 — Suggest dinners:** **Suggested for you** · `POST /api/dinners/suggest` · `lib/assumed-pantry.ts` + `lib/suggest-dinners.ts` validation · UI pantry note · AI meals temporary (no localStorage, no Delete).

### Verification (what was actually run)

| Layer | What | Result |
|---|---|---|
| **Automated — `npm test`** | Vitest, **12 files**, **70 tests**; `lib/` statements **~90.5%**, branches **~83.2%**, lines **~90.5%**. | **Green** 2026-09-29 (water-in-steps fix). |
| **Automated — spec 002 lib** | `lib/suggest-dinners.test.ts` · `lib/assumed-pantry.test.ts` — assumed staples vs forbidden pantry; step validation; mocked chat. | Covered. |
| **Automated — spec 001 + AI simplify** | `lib/simplify-dinner.test.ts` — AI POST validation; assumed staples; **water in rice steps**; `SimplerDinnerHelper.test.tsx` — AI payload + stale guard. | Covered. |
| **Automated — simplify diagnosis** | Agent `curl` to `/api/dinners/simplify` — **503** + `step_ingredients` before fix; **200** after water allowed (not a browser test). | **Green** 2026-09-29. |
| **Automated — spec 002 lib** | `lib/ingredient-fingerprint.test.ts` | Covered. |
| **Automated — spec 002 UI** | `KitchenApp.test.tsx` — mocked `/api/dinners/suggest` → AI row + seeded **Chicken and rice** still visible. | Covered. |
| **Automated — spec 001 regression** | Simplify + `SimplerDinnerHelper` stale tests; seeded choose flow. | Still green. |
| **Automated — OpenAI HTTP** | `lib/openai.ts` not hit in tests (~33% line coverage on that file). | **Not verified** by automation. |
| **Automated — routes** | No dedicated route test files; lib + UI mocks exercise handlers. | Partial. |
| **Automated — `npm run build`** | `next build` — routes `ƒ /api/dinners/simplify`, `ƒ /api/dinners/suggest`. | **Green** 2026-09-29. |
| **Manual — browser (Junyao)** | **Make it simpler** end-to-end with live OpenAI after water-validation fix. | **Confirmed** 2026-09-29. |
| **Manual — browser** | **Suggest dinners** + choosing AI meals + simplify on **AI** dinner specifically. | **Not verified** in reported manual test (only simplify success confirmed). |
| **Manual — browser** | Stale simplify ignored when switching dinner or editing ingredients mid-request. | **Not verified** manually. |

Automated tests **never** read, log, or print the API key.

### Remaining limitations

- AI suggestions and simplifications are **not saved** across refresh.
- **Review** / **used** ingredients never sent to OpenAI; suggestions depend on **name accuracy** only (no amounts).
- Server may **drop** model output that fails validation (unlisted seasonings beyond oil/salt/pepper/water-for-cooking, extra cookable names in steps, > 20 min, safety phrasing). A **503** with server log `reason: step_ingredients` means the model text failed this check — not a missing key.
- AI suggestions and simplified steps remain **session-only** (cleared on refresh or list change).
- Missing **`OPENAI_API_KEY`**: suggest/simplify actions show inline errors; home page still loads.
- Live OpenAI quality (Use soon bias, meal creativity) is **manual** only.

## 5. What's active / what's next — *updated each wrap*

- **The long pole:** None — specs 001 and 002 shipped.
- **Queue:** Deploy to Vercel with env key; Neon; any new PRD/spec slice.

## 6. Key file locations

- Specs: `specs/001-ai-dinner-simplify.md` · `specs/002-ai-dinner-suggestions.md` · `specs/README.md`
- API: `app/api/dinners/simplify/route.ts` · `app/api/dinners/suggest/route.ts`
- UI: `components/KitchenApp.tsx` · `SuggestDinnersSection.tsx` · `SimplerDinnerHelper.tsx`
- Lib: `lib/assumed-pantry.ts` · `lib/suggest-dinners.ts` · `lib/simplify-dinner.ts` · `lib/openai.ts` · `lib/cookable-ingredients.ts` · `lib/ingredient-fingerprint.ts`

## 7. Architecture notes (don't change without understanding)

- Seeded vs AI selection is mutually exclusive in `KitchenApp` (`selectedDinnerId` vs `selectedAiDinner`).
- `SuggestDinnersSection` remounts when ingredient fingerprint changes (`key={buildIngredientFingerprint(...)}`).
- Missing database must not crash build — seed + localStorage only.

## 8. Open external actions (only the human can do these)

- [ ] GitHub repo + Vercel deploy
- [ ] `OPENAI_API_KEY` in local `.env` and Vercel project (for suggest + simplify)
- [ ] Neon (optional)

## 9. Things that are easy to get wrong (append-only, one line each)

- Writing new records to a JSON file on the server looks fine locally and goes empty on Vercel — use localStorage until Neon exists.
- Calling OpenAI from the browser exposes keys and hits CORS — use route handlers only.
- Only `OPENAI_API_KEY` in `.env`; model is hardcoded in `lib/openai.ts`.
- Product rules in pages skip the coverage floor — keep validation in `lib/`.
- Switching dinners during simplify, or editing ingredients during suggest, must ignore stale responses.
- AI step text is validated server-side — do not trust the model to stay within the ingredient list.
- Simplified steps that mention **water** for boiling rice are OK; other pantry words (soy sauce, butter, etc.) still require a list match unless they are the three assumed staples.

## 10. Operating commands

```bash
npm run dev      # http://localhost:3000
npm test         # Vitest + lib/ coverage floor
npm run build    # production build
```

If `npm` is missing from PATH: `./node_modules/.bin/vitest run --coverage` and `./node_modules/.bin/next build`.

## 11. Source-of-truth precedence (when two artifacts disagree)

1. `.cursor/rules/workshop.mdc`
2. `PRD.md`
3. The relevant spec
4. The code
5. **This handoff** — fix the handoff if it drifts.

## 12. The human, in brief

- MBA student; short plan → small change → check the page.
- Never commit `.env` or put secrets in client code.

## 13. Change log

| Date | Change |
|---|---|
| 2026-09-29 | **Make it simpler** manual browser test confirmed (Junyao). Fix: water no longer rejected in simplify step validation; 70 tests, build green. |
| 2026-09-29 | Make it simpler on AI dinners; server recipe validation; 69 tests, build green. |
| 2026-09-29 | Assumed pantry staples (oil, salt, pepper) for suggest + simplify; tests 66, build green. |
| 2026-09-29 | Handoff after spec 002 shipped; verification table updated. |
| 2026-09-29 | Spec 001 verification + limitations (prior). |
