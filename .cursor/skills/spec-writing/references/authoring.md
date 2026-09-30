# How to write each section

Read this when filling a new spec or tightening a weak one.
Write **done criteria first**. They make the rest of the spec honest.

---

## User stories

Canonical format — do not improvise:

> **As a [persona]**, when I [trigger], I need [job to be done] so I can [desired outcome].

This is richer than "As a / I want / so that": the **trigger** is the
decision the agent will implement (submit, download, fail, return).

- 2–4 stories. More than four usually means the spec is two slices.
- Primary persona plus one secondary where the need diverges (reviewer,
  inheriting agent, operator during an outage).
- Internal tooling: the personas are the maintainer and/or the next agent.
  Write them anyway.
- Personas are concrete. "Practice owner who just finished the
  questionnaire" reads. "User" does not.
- Triggers are moments. "When I hit submit with a malformed email"
  beats "when I use the form".
- Outcomes are observable. "So I trust the form worked" reads. "So I
  feel safe" does not.
- No marketing-speak. No story whose outcome is "so I can use the feature."
- A story names a person, not a feature ("As the landing page" is wrong).
- Do not write one story per done-criterion box. Stories are why.
  Criteria are how we verify.

---

## Done criteria

Each box is independently verifiable. Aim for 5–12. Order by importance
so a context-limited agent still hits the ones that matter.

Each criterion is:

- **Executable or observable.** A command, a URL state, a response
  shape. If you cannot verify it, it is an opinion.
- **Binary.** Pass or fail. Not "reasonably fast" or "feels clean"
  (those belong in a project rule file).
- **Singular.** INCOSE: one statement per box. Split
  "tests pass AND coverage ≥ 85%" into two.
- **Named verification.** The box itself says how you will know
  (`npm run build` / load `/pricing` / `curl` the success shape / the
  project's actual check).

Include at least one **unwanted-behavior** box (Joel: the error cases
are the decisions). What happens on malformed input, provider outage,
missing entitlement, empty state.

If the project has a docs / help / changelog surface that this slice
changes, add a box for it. Do not invent that box on projects without
the surface.

### EARS (Easy Approach to Requirements Syntax)

Use EARS for event-, state-, and failure-driven boxes. Five patterns
(Mavin / Rolls-Royce; now the default in agent-era spec practice):

| Pattern | Form | Use |
|---|---|---|
| Ubiquitous | THE [system] SHALL [behavior]. | Always true. No trigger. |
| Event-driven | WHEN [trigger] THE [system] SHALL [response]. | User or system event. |
| State-driven | WHILE [state] THE [system] SHALL [behavior]. | Holds in a mode or entitlement. |
| Unwanted | IF [condition] THEN THE [system] SHALL [response]. | Errors, outages, abuse. |
| Optional | WHERE [feature is present] THE [system] SHALL [behavior]. | Gated / configured capability. |

Example: *WHEN a submitted email is malformed, THE form SHALL return
a 400 with an inline error and SHALL NOT create a record.*

Hollow (do not write these) — the agent cannot grade them, and neither can
the human reviewer:

- "The page loads without errors."
- "The feature works correctly."
- "No console errors."

Checkable — a click, a type, or a refresh with a visible result:

- WHEN the user submits a new item THE list SHALL show it within 2s.
- IF the required field is blank THEN THE form SHALL show an inline
  message and SHALL NOT create a record.
- WHEN the user refreshes after adding an item THE list SHALL still
  include that item (seed + localStorage until a later store exists).
- IF there are no items THEN THE list SHALL show a short empty-state
  message and SHALL NOT render a blank page.

If the slice persists user-created records, takes form input, or shows
a list, include one box for each of those three cases (or `n/a` with a
one-line reason). These are the cases that break demos.

Prefer **SHALL** (must) for done criteria. Use SHOULD only for
non-blocking quality intent, and say so. Do not write MAY into a
checkbox — that is out of scope or a nice-to-have dependency.

Given-When-Then is welcome **inside the test plan** as a scenario
script. Keep § 4 in EARS or plain checkable sentences so the spec
does not grow a second notation.

---

## Constraints (must NOT)

What the agent must not touch, add, or change **in this slice**.
Highest-leverage section in the file. Typical entries:

- No new runtime dependencies (or: only the named package).
- Do not change [contract / data shape / public API] — locked by spec NNN.
- Do not touch files outside [allowed write paths].
- No refactors beyond what the done criteria require.
- Cite `.cursor/rules/<file>.mdc` § "[section]", not a vibe.

"None" is almost always wrong. If the slice is truly unconstrained,
write why in one line.

---

## Out of scope vs constraints

- **Constraints** = must not happen while building this slice
  (don't add Mongo, don't restyle the app).
- **Out of scope** = adjacent capability this slice will not ship,
  with a pointer (spec `NNN-name.md`, future spec unassigned, or
  "won't build").

A thing can appear in both: "do not add auth" (constraint) and
"Authentication — future spec, unassigned" (out of scope).

---

## Open questions

Three fields, every row:

| Question | Owner | Blocking? |
|---|---|---|
| The concrete undecided thing | Named person or role, never "someone" | `yes` or `no` |

`yes` = do not generate production code against a guess.
`no` = may proceed as accepted risk; record the assumption.

Blocking topics usually include: public API shapes, data migrations,
permission boundaries, payment behavior, rollback, user-facing legal
copy.

---

## Architecture notes

Only what is **load-bearing** — the next agent would guess wrong
without it. Persistence shape, integration contract, what this
deletes rather than adds, security posture, a performance budget
that this slice owns.

Not a design-doc dump. Not a restatement of the PRD. If it is already
in `_data-shapes.md` or a project rule, link it.

---

## Domain & quality guardrails

Where standing project rules apply **to this slice**. Cite the rule
file and the surface.

- Security / privacy / compliance (logging, secrets, citations, claims)
- Copy (forbidden words, sentence case, disclaimer placement)
- Quality bars this slice must meet (accessibility, performance budget)

Default: `n/a — no project domain-rule file applies to this slice.`
Do not paste a HIPAA or copy checklist into a repo that has none.

---

## Test plan

The commands and surfaces that prove § 4. This project’s gate is
`npm test` (Vitest, `lib/` coverage floor) then `npm run build`.
Name the store cases, the `lib/` functions this slice added, and the
screen cases this slice owns (empty / first visit, blank or bad
input, refresh). Write `n/a` for a case the slice does not own.

Do not invent a CI stack or add Playwright. Do not require Lighthouse
on a CLI tool.

---

## Writing rules for the file itself

- Concrete over abstract. `POST /invoices` beats "an invoicing endpoint."
- Present tense for the contract; past tense for the change log.
- Under ~200 lines. Past that, split.
- Do not duplicate the strategy doc. Link to its section.
- If the project has a copy/style rule, it applies to the spec too.
