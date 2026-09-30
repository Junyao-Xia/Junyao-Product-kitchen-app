---
name: session-handoff
description: >-
  Load when the user asks to wrap up a session, update the handoff,
  write HANDOFF.md, or hand off to the next agent. Phrases: "wrap up
  this session", "update the handoff", "hand off for tomorrow".
  Do not load for specs, PRDs, commits, or starting a new feature.
---

# Session handoff

`HANDOFF.md` is the **living session snapshot**. A fresh chat reads it
first and picks up in minutes instead of re-deriving state.

It is **not** the product contract (`PRD.md`), the look (`DESIGN.md`),
or a delivery slice (`specs/`). It points at those. When it disagrees
with them, **the handoff is wrong** — fix it to match.

---

## What the model should do

1. **Find or create `HANDOFF.md`.** Prefer the app-root file (bootstrap
   already put it there). If missing, recreate the same sections listed
   in [`references/what-to-update.md`](references/what-to-update.md)
   and fill § 1–3 from `PRD.md`, `DESIGN.md`, and
   `.cursor/rules/workshop.mdc` before wrapping state. Do not invent a
   second handoff path or a second template file.
2. **Gather truth from the repo, not memory alone.** Read `PRD.md` § 4,
   `specs/README.md` (if present), recent spec status, and what this
   session actually changed. Run `npm test` and record red/green in
   § 4. Prefer files and the conversation over a stale § 4.
3. **Update state sections only** unless a contract truly changed.
   Details: [`references/what-to-update.md`](references/what-to-update.md).
4. **Write a sharp Next session pickup** — one present-tense sentence
   with a spec ID or file path. The next agent should know the first
   action without asking.
5. **Replace** the recent-audit paragraph (do not append). Add one
   change-log row for this wrap.
6. **Stop.** Do not start the next feature in the same turn unless the
   user asks. End by pasting the recommended fresh-chat opener.

Recommended opener for the human’s next chat:

> Read `HANDOFF.md` first. Follow the reading order in § 3. Then do the Next session pickup — do not rebuild anything already shipped.

---

## Gotchas

- Do not rewrite § 1–3, 6, 11, or 12 “for freshness.” Touch them only
  when the product, rails, paths, or human constraints actually changed.
- Do not put delivery status in `PRD.md` — that lives in `specs/` and
  the handoff’s § 4 pointer.
- Do not name a design system in the handoff beyond “follow `DESIGN.md`”
  (unless filling a worked example that already documents one choice).
- Do not clear § 9 pitfalls; append a one-liner only when this session
  discovered a new footgun.
- Do not mark human-only checklist items done unless the human confirmed
  (keys in Vercel, Neon provisioned, etc.).
- Spec status in § 4 must match `specs/README.md`. If they drift, fix
  both or say which is authoritative and align them.
- Handoff is **last** in precedence (§ 11). Never use it to override
  `workshop.mdc` or `PRD.md`.
- The wrap message the student sees is product-shaped (what shipped,
  what to do next). Do not narrate the course or a "later session."

---

## On-demand resources

- What to rewrite vs leave alone: [`references/what-to-update.md`](references/what-to-update.md).

---

## What this skill is not for

- Not for a first draft of `PRD.md` or a new spec (use
  `product-interview`).
- Not for writing a spec or updating `specs/README.md` alone (use
  `spec-writing`).
- Not for a pre-build second opinion on a PRD or spec (use
  `pre-build-review`).
- Not for rewriting `PRD.md` or `DESIGN.md`.
- Not for writing tests (use `writing-tests`).
- Not for commits, PRs, or starting the next build without a wrap.
