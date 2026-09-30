# PRD — Quick dinners from what you have

**Author:** Junyao  ·  **Date:** 2026-09-29  ·  **Version:** 0.4

> **How to fill this file**
> - Fill in **sections 1–4** (required). Sections **5–8** are optional but make the agent far more accurate.
> - Keep it to about **one page**. Use bullets and tables, not paragraphs — agents parse structure better than prose.
> - **Be specific and measurable.** Replace vague words ("nice", "intuitive", "fast") with numbers and observable behavior.
> - **Every requirement gets an acceptance criterion** you can click or type and see — not "it works" or "no console errors."
> - **At least one P0 covers an unexpected case:** empty / first-visit state, blank or bad input, or refresh (the item you just added is still there).
> - Mark anything you're guessing with **`[ASSUMPTION]`** — don't invent facts or numbers.
> - When you are ready to build, tell Cursor:
>   *"Read `PRD.md` and `DESIGN.md`. Follow the workshop rule. Seed from local JSON in `data/`; put new items in localStorage. No database or API keys yet. Do not write a JSON file on the server. Ask me any clarifying questions first, then build the smallest working version of the P0 must-haves in section 4, following the build order."*
>
> *Sections map to the **Lean Product Process**: target customer → underserved needs → value → MVP feature set.*

---

## 1. Product Summary

- **One-liner:** For a college student who lives alone, shops once a week, and cooks after class, **this app** is a fridge list that shows a twenty-minute dinner from food they already have, using whatever needs to be used first.
- **Value proposition:** After class, see a twenty-minute dinner from the food you already have, using whatever should be used soon first.
- **TL;DR:** She records ingredients and reminder dates, sees what to use soon, and opens one of up to three 20-minute dinners for its ingredients and short steps. Sample dates are set from the day she first opens the app; her later edits stick. A passed date sits in "Review" and stays out of dinners until she keeps it. The app does not determine food safety.

## 2. Target Customer

- **User / buyer:** A college student who lives alone, shops once a week, and cooks a quick dinner after class. Same person decides to use the app.
- **Example — Maya Alvarez, 20, junior, studio near campus.** Home around 6:15, hungry, homework still waiting. **[ASSUMPTION]** About ten library hours a week and about $70 for one shop (chicken, spinach, rice, eggs, tortillas, yogurt, half an onion). She means to cook the chicken later and sometimes does not.
- **Defining attributes:**
  1. Cooks for one after class and wants dinner in about 20 minutes.
  2. One weekly shop, so food sits for several days.
  3. Needs a short decision, not a long recipe search.
  4. **[ASSUMPTION]** Will keep using it only if adding and updating ingredients stays quick.

## 3. Customer Problems & the Bet

Persona situation, not quotes from a customer interview.

1. "I get home around 6:15 and still have to decide dinner from whatever is left."
2. "Food from Sunday is still in the fridge, and I forget to use it before the reminder date."
3. "I need something I can cook in about 20 minutes, starting with what I should use first."

- **Riskiest assumption:** She will enter ingredients and reminder dates, and update them when she cooks, often enough that the dinner list matches what is on hand. **[ASSUMPTION]**
- **The bet:** A fridge list plus up to three 20-minute dinners, soonest upcoming reminder first, will help her choose dinner from food she already has. **We'll know we're right if she can add an ingredient, see it under "Use soon" when the date is soon, and open a suggested dinner that includes it.** A real weeknight is still a hypothesis.

## 4. Product Requirements / Functionality

**Key user stories**
- As Maya, I want to add an ingredient and a reminder date so that I see it next time I open the app.
- As Maya, I want "Use soon" and "Review" kept separate so that I use what is coming due, and I decide what to do with a passed date.
- As Maya, I want up to three 20-minute dinners from what I can still use, soonest first, so that I can choose after class.
- As Maya, I want the dinner I choose to show its ingredients and short steps so that I can cook it.
- As Maya, I want name, date, and used edits on sample and added ingredients to survive refresh.

**Must-haves for v1**

| ID | Requirement | Priority | Acceptance criterion (observable / measurable) |
|----|-------------|----------|------------------------------------------------|
| R1 | Add an ingredient with a name and a reminder date. | P0 | Enter "chicken" and a date → it appears within 2s and is still there after refresh. |
| R2 | Reject a blank ingredient name. | P0 | Submit with the name blank → an inline message; no new ingredient is created. |
| R3 | Reject a missing reminder date. | P0 | Submit with the date empty → an inline message; no new ingredient is created. |
| R4 | Populate the first open from sample offsets, and show an empty state when nothing is available. | P0 | On first open, sample reminder dates are that calendar day plus each item's offset: at least one date before today ("Review"), one today or within 2 days ("Use soon"), and at least one dinner that does not need the "Review" item. After every available ingredient is marked used, a short empty-state message shows — never a blank page. |
| R5 | Keep edits and used status for sample and newly added ingredients. | P0 | Change the name or reminder date, or mark used, on one sample ingredient and on one she added. Refresh → both edits are unchanged. Sample dates are not rebuilt from their offsets. |
| R6 | Separate "Use soon" from "Review." | P0 | Reminder date today or within the next 2 days → "Use soon." Date before today → "Review," not "Use soon." Neither group says the food is safe or unsafe. |
| R7 | List up to three 20-minute dinners from ingredients she can use, soonest first. | P0 | With chicken (reminder in 1 day) and rice available, and neither in "Review," a dinner that uses both appears and shows "20 min." If two dinners match, the one that uses the earliest "Use soon" date is first. At most 3 show. A dinner that needs a "Review" ingredient is not shown. If none match, a short message appears. |
| R8 | Keep suggestions on the seeded meals. | P1 | Each suggested dinner is one of the seeded meals. None over 20 minutes is shown. |
| R9 | Require Keep before a "Review" ingredient can be cooked from. | P0 | An ingredient in "Review" is not listed on any suggested dinner. Choose Keep and set a reminder date of today or later → it leaves "Review" and can appear in dinners. Mark it used → it stays out of dinners. A Keep date before today leaves it in "Review." |
| R10 | Show ingredients and short steps for the dinner she chooses. | P0 | Choose the dinner that uses chicken and rice → its name, those ingredient names, and at least two short cooking steps are on screen. Choosing it does not mark those ingredients used. |

*(P0 = must ship for v1 · P1 = should · P2 = nice-to-have.)*

**Groups:** "Use soon" = today or the next 2 days. **[ASSUMPTION]** 2 days is the right window. "Review" = before today. The app does not decide food safety. Keep means a new reminder date of today or later. Until then, dinners skip that ingredient.

**Build order:** 1) seed JSON in `data/` + localStorage for new and edited items → 2) core action → 3) UI → 4) extras. No database, third-party APIs, or OpenAI unless a requirement above needs them.

**Explicitly NOT in v1:**
- Determining whether food is safe to eat.
- Barcode, photo, or receipt scanning. Accounts, login, or a shared kitchen. Push notifications.
- A meal calendar, shopping list, grocery delivery, nutrition, calories, or allergy filters.
- A large recipe catalog, imported or generated recipes. Payments.
- Recomputing sample dates after the first open. Choosing a dinner does not mark its ingredients used.

**Do NOT change / keep working:** No screens yet.

## 5. Data Model

**Persistence:** Seed in `data/*.json`. On first open, resolve sample offsets to `reminderDate` and save ingredients in localStorage. Later visits read localStorage. Do not write a JSON file on the server. New ingredients, and edits to sample or added ones (`name`, `reminderDate`, `status`), live in that same saved list.

- **Ingredient** — `id`, `name`, `reminderDate`, `status` (`available` or `used`). Seed file `data/ingredients.json` stores `reminderOffsetDays` (integer days from the first-open date), not a fixed calendar date. Example offsets: spinach `-1`, chicken `+1`, rice `+4`. "Use soon" and "Review" are calculated from `reminderDate` and today. They are not stored.
- **Dinner** — `id`, `name`, `minutes` (20), `ingredientNames` (string list), `steps` (at least two short strings) · seed in `data/dinners.json`. Eligible only when every name matches an available ingredient whose `reminderDate` is today or later.

## 6. Guidance on User Experience

- **Main user flow:** 1) First open shows sample ingredients dated from today, split into "Use soon" and "Review" → 2) Keep a "Review" item with a new date, or mark it used → 3) Add or edit any ingredient → 4) Read up to three 20-minute dinners → 5) Choose one and see its ingredients and short steps → 6) After cooking, mark ingredients used. Refresh keeps those edits.
- **Error / empty states:** Blank name or blank date → inline message, nothing saved. No available ingredients, or no eligible dinner → a short message. Never a blank screen.
- **Visual aesthetic:** Follow `DESIGN.md`.

## 7. Guidance on Tech Stack / Components

- **Stack:** Next.js + React + Tailwind + shadcn/ui, deploy on Vercel. Dinner matching uses the seeded dinners only. No API key for v1.
- **Must-use:** Ingredient list, "Use soon," "Review," and a short dinner list that opens into ingredients and steps.
- **Must-avoid:** Food-safety verdicts. "Review" items in dinners before Keep. Scanning, accounts, a recipe service, dinners over 20 minutes.

## 8. Other Info & Open Questions

- **Assumptions to validate:** She updates the list after she shops and cooks. She will Keep or mark used before she expects a passed item in a dinner. Three dinners are enough at 6:15. **[ASSUMPTION]** She now gets by with memory, notes, a web search, or takeout. **[ASSUMPTION]** Heavier inventory apps are easy to drop because logging takes too long. Not yet observed.
- **Open questions:** Product name is undecided. Quantities (half an onion) are not in v1.
