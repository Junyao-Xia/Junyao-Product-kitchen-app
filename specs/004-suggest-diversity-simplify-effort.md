# Spec 004 — Suggest meat diversity and simplify effort

| Field | Value |
|---|---|
| **Status** | `shipped` |
| **Owner** | Junyao |
| **Started** | 2026-09-30 |
| **Done** | 2026-09-30 |
| **Strategy ref** | `PRD.md` § 4 · specs 001–002 |

> AI suggest spreads cookable meats across up to three meals; Make it simpler returns shorter steps plus an honest improvement line.

---

## 1. What ships when this is done

**Suggest dinners** prompts and post-checks meat diversity (one meat per dish, different primaries when feasible, Use-soon focus list up to three meats) with one corrective retry. **Make it simpler** returns JSON with up to four steps (~80 words), validates real effort reduction, and shows one improvement sentence under **Simpler way** for seeded and AI dinners.

## 4. Done criteria

- [ ] Three cookable meats → three suggestions use different primary meats when feasible.
- [ ] Two cookable meats → both appear across suggestions when feasible.
- [ ] One cookable meat → varied dish names/methods; no multi-meat dishes.
- [ ] One diversity retry; partial count returns `message` in API/UI.
- [ ] Simplify: ≤4 steps, ~80 words, improvement sentence, already-simple path.
- [ ] Original steps remain visible; stale guard unchanged.
- [ ] `npm test` and `npm run build` green.

## 8. Change log

| Date | Change |
|---|---|
| 2026-09-30 | Initial ship on preview branch |
