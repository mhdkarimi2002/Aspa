# ASPA design system

Athletic, mobile-first UI for Iranian users. Web stack is Next.js, Tailwind v4, and shadcn/ui (`base-vega`, Lucide).

Token values live in `frontend/src/app/globals.css`. These docs say how to use them. Do not copy palettes into components.

## Docs

| File | Use when |
|------|----------|
| [tokens.md](tokens.md) | Color, type, space, radius, motion |
| [components.md](components.md) | shadcn composition and variants |
| [ux.md](ux.md) | Forms, focus, loading, RTL, accessibility |

## Decisions

- **Style:** Modern and quiet, with visible structure. Cards, borders, and an olive accent. No glass, neumorphism, or poster-scale type.
- **Color:** Dark is the default. Olive green, hue ~145, in `globals.css`. Orange, lavender, and purple gradients are rejected.
- **Type:** Vazirmatn for the Persian-only UI.
- **Density:** Comfortable, not sparse. One primary action per view, placed with the content it completes. Do not pin every action to the bottom of the viewport.
- **Icons:** Lucide only. No emoji as icons.

## Avoid

- Raw hex, `bg-green-*`, or a second accent family in components
- Placeholder-only inputs
- Physical `left` / `right` / `pl` / `pr` when a logical utility exists
- `'use client'` on a whole page for one interactive control
