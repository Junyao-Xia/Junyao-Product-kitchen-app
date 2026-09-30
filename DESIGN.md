# Warm kitchen

Calm, readable, and at home in a real kitchen. Cream canvas, dark green actions, warm surfaces, and clear status badges.

`DESIGN.md` is the only look. To change it later, edit hex values here and in `app/globals.css` `:root` (for example `--primary`). Do not add a second design file.

## Apply (once)

Token values live in the `:root { ... }` block in `app/globals.css`. Keep imports, `@theme`, and the base layer.

Tell Cursor: *Follow `DESIGN.md`. Use theme tokens only (`bg-primary`, `text-muted-foreground`, `bg-badge-use-soon`, etc.). Do not hardcode colors.*

## Colors
- Background (cream): `#FAF7F2`
- Surface / cards: `#FFFCF8`
- Text: `#1A2E22`
- Muted text: `#4A5D52`
- Border: `#E5DDD0`
- Primary (dark green): `#1B4332`
- Primary hover: `#163828`
- Primary on color: `#FFFFFF`
- Destructive: `#B91C1C`
- **Use soon badge:** background `#E3EED9`, text `#2D5016`
- **Review badge:** background `#F5E0C8`, text `#7C4A1E`

## Type
- Font: Inter, system-ui, sans-serif
- Page title: 28–32px, weight 600
- Section title: 18–20px, weight 600
- Body: 16px, weight 400, line-height 1.55
- Small / meta: 13px, muted token

## Shape and space
- Radius: 10px on cards and inputs, 8px on buttons
- Soft shadow on cards: `0 1px 3px rgba(26, 46, 34, 0.06)`
- Page padding: 24–32px
- Space between sections: 24–32px
- Max content width: 1120px, centered
- Desktop: two columns — dinners and details left, ingredients right
- Mobile: single column, dinners before ingredients

## Illustrations

Friendly cartoon SVGs in `public/illustrations/`. They sit beside or behind content — never replace labels, buttons, or recipe text.

- **Style:** Soft fills, rounded shapes, simple faces optional; no gradients or neon.
- **Palette (illustration-only):** Same family as the UI — cream `#FFFCF8` / `#FAF7F2`, dark green `#1B4332` outlines, muted `#4A5D52`, accent greens `#E3EED9` / `#7CB342`, warm tomato `#E07A5F`, carrot `#F4A261`, peach steam `#F5E0C8`, border `#E5DDD0`.
- **Opacity:** Decorative images use the `.kitchen-illustration` class (~88% opacity).
- **Placement:**
  - Page hero: open fridge with smiling vegetables next to the main heading (`fridge-hero.svg`).
  - AI suggestions: smiling pot when no AI dinners are shown yet (`cooking-pot.svg`); hidden while loading, on error, or after suggestions load.
  - Add ingredient: small tomato, carrot, and egg around the panel edges (`deco-*.svg`), `pointer-events: none`, `aria-hidden`.
- **Responsive:** Hero stacks above title on narrow screens; decor scales down on small viewports so forms stay readable.

## Components
- **Nav:** top bar, cream background, thin bottom border, product name left
- **Primary button:** solid dark green, white text, no gradient
- **Secondary button:** cream/white surface, warm border
- **Cards / panels:** warm white surface, 1px border, small shadow
- **Status badges:** filled text badges for “Use soon” and “Review” only — distinct token pairs, never used for safety verdicts
- **Forms:** labels above fields; reminder-date note sits directly under date inputs

## Do
- Generous line height for recipe steps and labels
- Left-align body text
- Keep ingredient rows compact on the right column

## Don’t
- Gradients, glass, neon, or dark mode
- Hardcoded hex in product components
- Illustrations that overpower text or block taps on mobile
- Safety language on badges (dates are reminders only)
