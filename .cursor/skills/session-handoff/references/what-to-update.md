# What to update on a wrap

## Always rewrite (state)

| Spot | How |
|---|---|
| Top **Snapshot date** | Today’s date + one short “what just landed” clause |
| Top **Next session pickup** | One present-tense sentence; include a spec ID or path |
| **§ 4 Current state** | Spec counts and one-liners; **replace** the recent-audit paragraph (`npm test` red/green, then the P0 walk) |
| **§ 5 What’s active / next** | Long pole + short queue after it |
| **§ 8 Open external actions** | Checkboxes only when the human confirmed |
| **§ 13 Change log** | One new row for this wrap — do not rewrite history |

## Rarely touch (contracts)

§ 1 What this is · § 2 Non-negotiable rules · § 3 Reading order ·
§ 6 Key file locations · § 11 Precedence · § 12 The human

Update these only if this session changed the product summary, rails,
paths, or how the human wants to work.

## Append-only

**§ 9 Easy to get wrong** — add a line when this session hit a new
pitfall. Never delete old lines.

## Leave alone unless broken

**§ 7 Architecture notes** — edit only if a load-bearing decision
changed (and it should usually land in a spec first).

**§ 10 Operating commands** — workshop default stays unless the app’s
scripts really differ.

## Quality bar for the pickup line

Bad: “Continue building the app.”
Good: “Spec 003 — wire OpenAI theme + sentiment on submit; Untagged fallback if the call fails; do not touch the dashboard layout.”

The next agent should not need to ask what to do first.
