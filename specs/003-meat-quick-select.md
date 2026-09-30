# Spec 003 — Meat quick-select on Add ingredient

| Field | Value |
|---|---|
| **Status** | `shipped` |
| **Owner** | Junyao |
| **Started** | 2026-09-30 |
| **Done** | 2026-09-30 |
| **Strategy ref** | `PRD.md` § 4 (R1, R2) |

> Quick-select Beef, Pork, Chicken, and Duck fills the name field only; duplicates blocked for available list entries, not for used ones.

---

## 1. What ships when this is done

On **Add ingredient**, four **Quick select** buttons (Warm kitchen outline/primary buttons) set the **Name** field. The user still chooses a **reminder date** and taps **Add ingredient**. Manual typing works. An available duplicate name is rejected with an inline message; a meat can be added again after the prior entry was **Mark used**. Meats are not assumed pantry — AI suggest/simplify only use them when cookable on the list (unchanged rules). Kitchen illustrations stay in place.

## 2. User stories

- **As Maya**, when I shop for meat, I want one-tap names so I can add items quickly after picking a reminder date.
- **As Maya**, when Chicken is already on my list, I need a clear block so I do not duplicate it — but I can add Chicken again after I mark the old one used.

## 3. Surfaces

- Components: `components/QuickSelectMeats.tsx`, `components/KitchenApp.tsx` (form only)
- Lib: `lib/quick-select-meats.ts`, `lib/validate-ingredient.ts` (`validateAddIngredient`)
- Env vars: n/a

## 4. Done criteria

- [ ] **Add ingredient** shows Beef, Pork, Chicken, Duck quick-select; tapping fills **Name** only.
- [ ] WHEN the user submits without a date THEN inline reminder error; no new row.
- [ ] IF the name matches an **available** ingredient (case-insensitive) THEN inline duplicate message; no new row.
- [ ] WHEN the only matching entry is **used** THEN add succeeds.
- [ ] Quick-select button disabled when that meat is already **available** on the list.
- [ ] Meats are not in assumed pantry; AI paths unchanged except list-driven cookability.
- [ ] Illustrations from prior work remain visible.
- [ ] `npm test` succeeds (`lib/` coverage floor)
- [ ] `npm run build` succeeds

## 5. Constraints (must NOT)

- Do not add meats to assumed pantry or seed JSON for this slice.
- Do not auto-submit on quick-select tap.
- Do not change illustration assets except layout spacing if required.

## 6. Out of scope

- Other protein presets — future spec
- Barcode / search — `PRD.md` non-goal

## 7. Dependencies

- **Blocking:** n/a — builds on shipped app + illustrations on `main`
- **Nice-to-have:** n/a

## 8. Change log

| Date | Change |
|---|---|
| 2026-09-30 | Initial ship on preview branch |

## 11. Test plan

- `lib/validate-ingredient.test.ts` — duplicate available vs used re-add
- `lib/quick-select-meats.test.ts` — not assumed pantry
- `components/KitchenApp.test.tsx` — quick-select fill, duplicate block, re-add after used (if covered in screen tests)
