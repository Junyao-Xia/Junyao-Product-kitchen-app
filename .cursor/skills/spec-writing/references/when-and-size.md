# When to write a spec, and how big it is

Read this when deciding *whether* a spec exists and *how to split* one.

---

## When a spec is needed

| Situation | Spec? |
|---|---|
| New user-facing surface, API, or third-party integration | yes |
| New vertical slice (logic + content + UI together) | yes |
| Replacing a placeholder with a real implementation | yes |
| Adding a new product/app to a platform | yes — roadmap spec first, then slices |
| Rename, copy tweak, lint | no |
| Refactor that preserves behavior on the same surface | no — change-log the existing spec |
| Bug fix that does not change the contract | no |

If in doubt: would another agent reading only `specs/NNN-name.md` ship
this slice end-to-end and check it off? If yes, it is a spec.

---

## One spec is the right size when

- **One coherent capability** you can say in a sentence ("the landing
  page", "the free-preview flow", "transactional email wiring").
- **Buildable in 1–10 focused work-days.** Trivia is a change-log
  entry. Bigger than ten days is a split.
- **Near-independently shippable.** Done criteria must not wait on
  another *in-flight* spec. Dependencies on already-shipped specs are
  fine.
- **One owner** in your head at a time.
- **Done criteria are checkable** with no adjectives.

This is INVEST (Independent, Negotiable, Valuable, Estimable, Small,
Testable) applied to the slice, not to a Jira ticket.

### Calibration

| Title | Right size? | Why |
|---|---|---|
| "Build the assessment" | no — too big | Weeks of competing scope. Split by engine, content, UI, scoring, output. |
| "Add validation to the email field" | no — too small | Detail of a larger action spec. Change-log that spec. |
| "Free preview flow — sections 1+2, score reveal, email gate" | yes | One user journey. About a week. |
| "Transactional email wiring" | yes | One integration. About a day. |
| "PDF generation" (every artifact) | no — split | One spec per artifact, each evaluable on its own. |

### If it grows past ~10 work-days or ~200 lines

Split horizontally (per artifact, route, or content pack) or temporally
(skeleton → real data → polish). Give children their own `NNN`s. Leave
the original `cancelled` with pointers. Do not reuse the number.

---

## Systems-level pre-speccing (AI-paced builds)

Human-paced rule: do not stockpile `planned` specs that will go stale.
AI-paced rule (slices ship in hours): **underspecifying shared contracts
is more expensive than writing the set.**

When the next build is imminent and several slices share types:

- Lock data shapes, route taxonomies, ID conventions, and naming unions
  **once**, in a supplementary `_*.md` (usually `_data-shapes.md`).
- Treat that file as load-bearing. Drift between a slice-spec and the
  map is the same bug as drift between a `shipped` spec and the code.
- Individual specs stay one capability, under ~200 lines, with checkable
  done criteria. Only the *set* of planned specs may be larger.

"Spec-then-spec-then-spec" still applies to *idle* planned specs waiting
on a real-world signal. It does not apply to a cohesive batch authored
to lock a contract ahead of a build you are about to start.

---

## What this method refuses

**GitHub Spec Kit's three-file split** (`spec.md` + `plan.md` +
`tasks.md`) and a separate constitution file per feature. Those ideas
map onto things this method already has:

| Spec Kit artifact | Where it lives here |
|---|---|
| Constitution | Project `.cursor/rules/` or `AGENTS.md` — not a spec |
| Feature spec | The slice-spec itself (§ 1–6) |
| Plan | Architecture notes (§ 9) — only what is load-bearing |
| Tasks | Done criteria (§ 4) — the agent works the boxes |

Four hundred CoreFolio slices shipped against one ~200-line file. A
second and third file per slice is where agents drift and humans stop
reading.

Joel Spolsky's split still holds: the spec is **functional** (what the
user can do, error cases, decisions). Implementation detail belongs in
architecture notes only when the next agent would otherwise guess wrong.
