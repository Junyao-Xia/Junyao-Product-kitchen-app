---
name: writing-tests
description: >-
  Load when the user asks to write tests, add tests, cover this,
  fix coverage, ship this spec, or says the feature works after a
  build. Do not load for filling a PRD, a product interview, a
  pre-build review, wrapping a session, or a one-line style tweak.
---

# Writing tests

Prove this slice. Do not grow a suite. The runner and the `lib/`
coverage floor are already in the project.

---

## When this skill applies

A user-visible slice just works, they asked to write or fix tests, or
they asked to mark a spec shipped. Skip a rename, token tweak, or lint.

If they asked to **fill a PRD**, **interview**, **review before
build**, or **wrap up**, this is the wrong skill.

---

## What the model should do

1. **Rules in `lib/`.** Validate, merge seed + localStorage,
   calculate, filter, rank, match, format, allowlist, and fallback
   live in `lib/`. Pages and components render. If a rule still lives
   only in a page or a `useEffect`, move it first, then test it.
2. **Write only what this slice owns.**
   - Store: load seed, add a record, merged list is seed + new items,
     new items survive a store reload, empty merge is `[]`.
   - Required fields from `PRD.md`: reject blank or malformed; do not
     write a record.
   - Every new `lib/` function this slice added: happy path and each
     branch. Done criteria are the list. Do not invent extra product
     behavior to raise coverage.
   - Screens this slice owns: empty / first visit, blank or bad input,
     refresh still shows the new item. `n/a` if the slice does not
     persist, take input, or show a list.
3. **How.** Assert what the user sees or what the function returns.
   At most ~5 screen tests. Semantic queries (`getByRole`, labels).
   No snapshots. No Playwright. No new libraries. Do not call OpenAI
   or a third-party API — test the fallback and any parser you wrote.
   Do not test `app/`, `components/ui/`, or layout to pad coverage.
4. **Run the gate.** `npm test` then `npm run build`. Fix red. Do not
   lower the `lib/` floor (80% lines and branches). Do not mark a spec
   `shipped` if either command is red.
5. **Stop.**

---

## Gotchas

- Coverage counts `lib/` only. Padding `app/` or shadcn does not help
  and is not allowed.
- `expect(fn).toBeDefined()` and importing a file "for coverage" are
  not tests.
- A thin OpenAI client can stay untested. Product rules do not live
  in that file.
- Do not add CI, Playwright, or a second runner unless they ask.

---

## What this skill is not for

- Not for filling `PRD.md` or drafting a spec (use
  `product-interview`).
- Not for a pre-build second opinion (use `pre-build-review`).
- Not for wrapping a session (use `session-handoff`).
- Not for marking spec status without running the gate (use
  `spec-writing` after tests are green).
