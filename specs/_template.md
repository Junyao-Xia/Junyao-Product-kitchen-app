# Spec NNN — [Capability name in sentence case]

| Field | Value |
|---|---|
| **Status** | `planned` |
| **Owner** | [your name] |
| **Started** | YYYY-MM-DD |
| **Done** | — |
| **Strategy ref** | `PRD.md` § [X] |

> [One sentence. What this slice delivers.]

---

## 1. What ships when this is done

[One short paragraph. What can the user do now that they could not
before? Name the screen, list, or artifact in the words they will see.]

## 2. User stories

2–4 stories. Primary persona plus one secondary where the need diverges.

- **As a [persona]**, when I [trigger], I need [job] so I can [observable outcome].
- **As a [persona]**, when I [trigger], I need [job] so I can [observable outcome].

## 3. Surfaces

Concrete paths this spec adds or materially touches. Project tree — no `src/`.

- Routes: `[/path]`
- Components: `components/…`
- Actions / API: `app/actions/…` or `app/api/…`
- Seed / lib: `data/…` · `lib/…`
- Env vars: `OPENAI_API_KEY` only when this slice needs OpenAI (server-only; model is hardcoded as `gpt-4o-mini`) — or `n/a`

## 4. Done criteria

Independently verifiable. 5–12 boxes. Write these first. Event, state,
and failure boxes use EARS: WHEN / WHILE / IF … THE [system] SHALL.

Name the three cases that break demos. At least one box for each that
this slice owns (or `n/a — this slice does not persist / take input /
have a list`):

- empty / first-visit state
- bad or blank input
- refresh (seed + localStorage still shows what the user just added)

- [ ] [Happy path — load a URL, do the main action, see the result]
- [ ] WHEN [user does the core action] THE [system] SHALL [observable result]
- [ ] IF [list or board is empty] THEN THE [system] SHALL [show a short message — never a blank screen]
- [ ] IF [required field is blank or malformed] THEN THE [system] SHALL [inline error] and SHALL NOT [create a record]
- [ ] WHEN [the user refreshes after adding an item] THE [system] SHALL [still show that item]
- [ ] `npm test` succeeds (`lib/` coverage floor)
- [ ] `npm run build` succeeds

## 5. Constraints (must NOT)

What this slice must not touch, add, or change.

- Do not add a database, API keys, or require a filled `.env` unless `PRD.md` asks for this slice. When OpenAI is in scope: only `OPENAI_API_KEY` in `.env`; hardcode model `gpt-4o-mini` — do not add a model env var.
- Do not write a JSON file on the server.
- Do not invent a new visual style — follow `DESIGN.md`.
- Do not switch stacks (no Vite, no `src/`, no second database).
- [Do not change … — locked by spec NNN or `PRD.md` § X]

## 6. Out of scope (for this spec)

Adjacent capabilities this slice will not ship. Point at where they live.

- [Thing] — see spec `NNN-name.md`
- [Thing] — future spec, unassigned
- [Thing] — `PRD.md` non-goal

## 7. Dependencies

Mark **Blocking** vs **Nice-to-have**.

- **Blocking:** spec `NNN-name.md` (`shipped` / `building` / `planned`) — or `n/a — first slice`
- **Blocking:** `[env var or human action]`
- **Nice-to-have:** spec `NNN-name.md`

## 8. Open questions

| Question | Owner | Blocking? |
|---|---|---|
| [undecided thing] | [named person] | yes / no |
| n/a — no open questions | — | — |

## 9. Architecture notes

Load-bearing decisions only. Persistence is seed JSON in `data/` plus
localStorage for new items until Neon. Do not invent a second store.

- [Note, or `n/a — no new architectural decisions`]

## 10. Domain & quality guardrails

Standing project rules that apply **to this slice**. Cite the file.

- Stack and secrets: `.cursor/rules/workshop.mdc`
- Folders: `.cursor/rules/folders.mdc`
- Look: `DESIGN.md` — do not invent a palette
- Copy / claims: [or `n/a — none for this slice`]

## 11. Test plan

- `npm test` succeeds — store (seed, add, merge, reload, empty) · required-field rejection · every new `lib/` function this slice added (happy path and each branch)
- Screen cases this slice owns: empty / first visit · blank or bad submit · add an item, refresh, confirm it stays (`n/a` if the slice does not persist / take input / have a list)
- `npm run build` succeeds (dev server not required)
- Walk every P0 acceptance criterion in `PRD.md` that this slice owns

## 12. Change log

| Date | Change |
|---|---|
| YYYY-MM-DD | Spec created. |
