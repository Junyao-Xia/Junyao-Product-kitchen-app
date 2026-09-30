# Delivery specs

This folder is the **build log**. Each numbered file is one delivery
slice — a coherent capability with a checkable done list.

Strategy lives in [`PRD.md`](../PRD.md). Look lives in
[`DESIGN.md`](../DESIGN.md). Code lives in `app/`, `components/`,
`lib/`, and `data/`. Specs sit between: what this slice is, how we
know it is done, and what we left out.

> New agent: read this index, then the `shipped` specs, then the
> `planned` / `building` rows for what is next.

---

## How to use this folder

- New spec: follow `.cursor/skills/spec-writing/`, copy
  [`_template.md`](./_template.md), claim the next `NNN`, add a row here.
- Implementing: set `building`, work the done-criteria list, then `shipped`.
- Audit: walk the spec's § 4 (done criteria) and § 11 (test plan).
  `npm test` then `npm run build` must be green before `shipped`.
  Reconcile drift with a change-log entry or a code change.
- **Numbers are immutable** — cancelled specs keep their number.

If a spec is growing past ~200 lines, split it.

---

## Status vocabulary

Status is the **work state**, not the git state. `shipped` means the
work is complete and ready to push/merge/deploy — not that it is
already on `main`.

| Status | Meaning |
|---|---|
| `reserved` | Number claimed, spec not yet authored. |
| `planned` | Scope written, not started. |
| `building` | Active implementation. |
| `blocked` | Named human action required. The action is in the one-liner. |
| `shipped` | Done criteria met; no remaining agent or human work. |
| `deferred` | Bumped past a gate; body says why. |
| `superseded` | Replaced by a later spec (named in the row). |
| `cancelled` | Will not be built. Kept as record. |

---

## Spec index

| # | Name | Status | Owner | One-liner |
|---|---|---|---|---|
| 001 | [ai-dinner-simplify](./001-ai-dinner-simplify.md) | `shipped` | Junyao | **Make it simpler** for seeded + **AI** dinners; server validates AI recipe; **Simpler way** below steps; stale guard on dinner + ingredient changes. |
| 002 | [ai-dinner-suggestions](./002-ai-dinner-suggestions.md) | `shipped` | Junyao | **Suggest dinners** + assumed oil/salt/pepper; ephemeral AI meals; simplify on AI detail (via spec 001). |
| 003 | [meat-quick-select](./003-meat-quick-select.md) | `shipped` | Junyao | **Quick select** Beef/Pork/Chicken/Duck on Add ingredient; available-only duplicate guard; re-add after **Mark used**. |
