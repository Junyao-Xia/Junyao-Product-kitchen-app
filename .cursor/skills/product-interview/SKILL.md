---
name: product-interview
description: >-
  Load for a product or feature interview: "fill the PRD", "help me
  write the PRD", "product interview", "write a spec for …", "feature
  interview". Do not load for reviewing a PRD or spec, marking a spec
  done, wrapping a session, or building.
---

# Product interview

Ask first, write second. The student shapes the product or a feature
slice in conversation; you fill the file that already exists in the
project. You do not build.

---

## When this skill applies

The student asked to fill, draft, or interview for `PRD.md` (the
product) or for a new spec (a feature slice). Run only when they asked.

If they asked to **review**, **build**, **wrap up**, or **mark a spec
shipped**, this is the wrong skill.

---

## What the model should do

1. **Choose the door.** Product / `PRD.md` → product interview.
   Spec / named feature / "this slice" → feature interview. If unclear,
   ask once: *product or this feature?* Then continue.
2. **Read what is already there.** Product: `PRD.md` (the template
   already in the app). Feature: `specs/_template.md`, `PRD.md` § 4,
   and `specs/README.md`. Do not invent a second template, a `/tasks`
   folder, or a `prd-[name].md` file.
3. **Ask clarifying questions before writing — one at a time.** Do not
   dump a list of questions. Ask **one** question, with lettered or
   numbered options when helpful, then **stop and wait** for their
   answer. Then ask the next. Cover what you still need:
   - **Product:** who, problem, one core action, not-in-v1, how we will
     know it worked.
   - **Feature:** what this pass ships, what is already on screen,
     what must not change, how we will know this slice is done.
   Skip a topic they already answered in this chat. When you have
   enough, say so in one sentence and move to step 4.
4. **After the interview, fill the file in one turn.**
   - Product: sections 1–4 of `PRD.md`. Look stays in `DESIGN.md`.
   - Feature: copy `specs/_template.md` to `specs/NNN-kebab-name.md`,
     add the index row in `specs/README.md`, set `planned`. Write
     done criteria first. Keep the slice small enough to demo.
   - No auth, payments, or extra pages unless they asked.
5. **Stop.** Do not build. Do not assign the next exercise.

---

## Gotchas

- **One question per message** during the interview. Never ask two or
  more clarifying questions in the same turn.
- Do not create `/tasks/` or save a second PRD file.
- Do not implement "just the first screen" or "just a stub."
- Do not narrate the workshop, course sessions, or stand-ins for OpenAI.
- If `PRD.md` is still the blank template and they asked for a feature
  spec, say the product is not drafted yet and offer the product door.
- Product language in the file — not "workshop constraint" or "later
  session."

---

## What this skill is not for

- Not for a second opinion before building (use `pre-build-review`).
- Not for marking a spec shipped, splitting a spec, or updating status
  (use `spec-writing`).
- Not for wrapping a session (use `session-handoff`).
- Not for writing tests (use `writing-tests`).
- Not for building, scaffolding, or debugging the app.
