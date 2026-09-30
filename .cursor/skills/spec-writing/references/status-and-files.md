# Status, numbering, files, and project overlays

Read this when creating a spec, changing its status, seeding `specs/`,
or working in a repo that already has its own conventions.

---

## Project overlay (do this first)

The project's `specs/_template.md` is the **only** template. There is
no second copy in this skill.

1. Copy `specs/_template.md` for new slices. Extra
   sections the project requires (compliance, push tags, help-docs
   impact) stay. Do not strip them.
2. If `.cursor/skills/spec-writing/SKILL.md` exists in the project and
   names different status tokens or required fields, use those tokens
   and fields.
3. Find the strategy doc from `specs/README.md` or the repo root
   (`PRD.md`, `STRATEGY.md`, `lean-startup/…/mvp-spec.md`, etc.).
   Link to a section. Do not paste strategy into the spec.
4. Match existing numbering width and path style (`app/` vs `src/app/`).
   Do not "fix" a live repo onto this skill's defaults.
5. Never overwrite a project's `_template.md` or rewrite historical
   specs to the default section list.

If `specs/_template.md` is missing, recreate it from an existing spec's
headings. Do not invent a second template. Bootstrap should already
have put `specs/_template.md` and `specs/README.md` in the app.

---

## Numbering and naming

- Path: `specs/NNN-kebab-case-name.md`
- `NNN` is zero-padded, **3 digits**, unless the repo already uses
  another width — then match the repo. After `999`, switch that repo
  to 4-digit padding. Never mix widths in one folder.
- Numbers are **immutable**. Cancelled and superseded specs keep their
  number. Never reuse.
- The name is the user-visible capability: `landing-page`,
  `free-preview-flow`, `transactional-email`. Not `phase-2-engine-work`.
- Next number: list `specs/` and add one. Numbers are assignment order,
  not delivery order.

---

## Status taxonomy (canonical — 8 states)

Exactly one token, in the spec header **and** `specs/README.md`.
Status is the **work state**, not the git state. An agent cannot know
what is on `main`. `shipped` means every done-criterion is met and
nothing remains for agent or human — ready to push/merge/deploy, or
already deployed.

| Status | Meaning |
|---|---|
| `reserved` | Number claimed; no body yet. File may be absent. |
| `planned` | Scope written. Keep this to the next 1–3 things, unless a cohesive pre-spec batch is locking a contract. |
| `building` | Active implementation. A small handful at once. |
| `blocked` | Cannot proceed (or agent work is done) until a **named human** action: credential, product/legal call, review. This is the human's to-do list. |
| `shipped` | Done criteria met. No remaining agent or human work. Source of truth for the intended contract. |
| `deferred` | Was planned; bumped past a gate. Body says why. |
| `superseded` | Replaced by a later spec, named in the annotation and the body. Keep the file. |
| `cancelled` | Will not be built. Keep the file. Do not delete. |

A token may carry a trailing annotation. Tooling should read only the
leading token.

Examples: `blocked — counsel review before go-live`,
`superseded by spec 176`.

Put the concrete action in the annotation **and** the README one-liner.

### Project aliases (do not invent these; honor them if the repo uses them)

| Alias you may find | Treat as |
|---|---|
| `pending-founder`, `pending-human` | `blocked` |
| `done`, `code complete` | `shipped` (or `blocked` if a human action remains) |
| `deprecated` | `superseded` |
| `needs-revision` | `blocked` or `building` |

On a greenfield repo, write only the eight canonical tokens.

---

## Special files in `specs/`

| File | What it is |
|---|---|
| `README.md` | Index: status, owner, one-liner. First file a new agent reads. |
| `_template.md` | Section contract for this repo. Underscore sorts it to the top. |
| `_data-shapes.md` | Cross-spec types: defined where, consumed where, open ambiguity. Author once five or more specs share types; load-bearing under AI-paced builds. |

Further `_*.md` files are allowed for other systems-level contracts
(feature inventory, architecture lock). `_` = spans specs. `NNN-` =
one slice.

Update the index on every status change, in the same turn.

---

## Status transitions

- **building → shipped:** check every done-criterion, set `shipped`,
  fill Done, add a change-log line.
- **building → blocked:** only a human action remains. Name it.
- **blocked → shipped:** the named action happened.
- **Scope change:** edit the spec, dated change-log line that names
  the trigger (conversation, learning, rule update).
- **Split:** new children with new `NNN`s; original `cancelled` with
  pointers.
