---
name: pre-build-review
description: >-
  Load when the user wants a second opinion on a PRD or spec before
  building. Phrases: "review this PRD before we build", "review this
  spec before we build", "second opinion on the PRD", "llm as judge".
  Do not load for writing a PRD or spec, wrapping a session, or
  building from the PRD.
---

# Pre-build review

The model that wrote the plan will say the plan is fine. This skill is
a **read-only second opinion** for a non-engineer: poke holes, then
stop. It does not edit files and it does not build.

---

## When this skill applies

The student asked for a review, second opinion, or "llm as judge" on
`PRD.md` and/or a spec **before** the next build. Optional — do not
run it unless they asked.

If they asked to **write** or **fill** a PRD, **write** a spec, **wrap
up**, or **build**, this is the wrong skill (`product-interview`,
`spec-writing`, `session-handoff`, or the workshop rule).

---

## What the model should do

1. **Same-chat gate.** If earlier messages in this conversation
   drafted, edited, or filled `PRD.md` or a spec, **do not review.**
   Tell them to open a **new chat**, switch to **Opus** (or another
   high-reasoning model), and paste `Review this PRD before we build.`
   (or the spec phrasing). Then stop. If they explicitly say "review
   in this chat anyway," proceed and say the review is weaker.
2. **Read the files, not memory.** Always read `PRD.md` § 4. If they
   named a spec or one is `building` in `specs/README.md`, read that
   too. If `PRD.md` is still the blank template, say so and stop.
3. **Do not edit.** No patches to `PRD.md`, specs, or code. If they
   ask you to apply the fixes here, tell them to switch to **Grok**
   for edits and **Composer 2.5** to build.
4. **Reply only in the scorecard.** Read
   [`assets/reply.md`](assets/reply.md) and fill it. Plain English.
   No jargon. No new product. No architecture lecture. Score the
   product they wrote — do not mention workshop rails, later
   sessions, or a stand-in for OpenAI.
5. **Stop.** End by telling them: keep, change, or ignore **Fix these
   3**; switch this model off; apply accepted edits with Grok; build
   with Composer 2.5.

---

## Gotchas

- A review in the writer chat is self-grading. Refuse unless they
  override.
- "The page loads" / "it works" / "no console errors" are not
  checkable — list them under **Can't check**.
- Do not invent a fourth surprise case. Only: empty/first visit,
  blank or bad input, refresh (item still there).
- Do not leave a high-reasoning model selected after you stop —
  remind them to switch off.
- Do not start implementing "just the small fixes."
- Do not narrate the course ("workshop constraint," "comes in a
  later session," tag-matching as a teaching technique).

---

## On-demand resources

- Before you reply, copy the headings in [`assets/reply.md`](assets/reply.md).

---

## What this skill is not for

- Not for writing or filling `PRD.md` or drafting a new spec (use
  `product-interview`).
- Not for writing a spec or marking a spec done against code (use
  `spec-writing`).
- Not for wrapping a session (use `session-handoff`).
- Not for writing tests (use `writing-tests`).
- Not for building, scaffolding, or debugging the app.
