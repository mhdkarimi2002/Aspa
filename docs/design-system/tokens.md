# Tokens

Source of truth: `frontend/src/app/globals.css`. The default theme is dark. Use semantic utilities (`bg-primary`, `text-muted-foreground`, `bg-card`). Keep hue ~145.

## Color

| Token | Use |
|-------|-----|
| `primary` / `primary-foreground` | The single main action, active nav, focus ring |
| `secondary` | Supporting actions |
| `muted` / `muted-foreground` | Surfaces behind chips, helper and meta text |
| `destructive` | Delete and errors. Pair with text or an icon, not color alone |
| `background` / `card` | Page versus raised surface |
| `border` / `input` | Dividers and field chrome |
| `ring` | Keyboard focus only |

Charts use `--chart-1` … `--chart-5` in order. Do not invent series colors.

## Type

Font: Vazirmatn via `next/font`, assigned to `--font-sans`, `display: swap`. Mono stays on `--font-mono`.

| Role | Classes | Weight |
|------|---------|--------|
| Display | `text-3xl leading-tight` | 700 |
| Title | `text-xl leading-snug` | 600 |
| Body | `text-base leading-normal` | 400 |
| Label | `text-sm leading-normal` | 500 |

Body text stays at least `text-base` on mobile. `text-xs` is for meta inside dense admin tables only.

## Space

Use the 4 / 8 scale: `1, 2, 3, 4, 6, 8, 12` (4px through 48px).

- Screen padding: `px-4`, `md:px-6`
- Content width: `max-w-6xl` for app shells, `max-w-sm` for auth
- Related items: `gap-2` or `gap-3`. Sections: `gap-8` or `gap-12`

## Radius and elevation

`--radius` is `0.625rem`. Controls use `rounded-md`. Full pills are for status only.

Separate surfaces with `border`, not shadow. `shadow-sm` is only for dialogs and popovers. Do not stack blur on shadow.

## Motion

150–300ms, ease-out on enter. Animate `transform` and `opacity` only. Honor `prefers-reduced-motion` by dropping movement and keeping color or opacity changes.
