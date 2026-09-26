# Components

Build from `frontend/src/components/ui`. Do not restyle primitives with one-off colors. Pass `variant`, `size`, and layout classes.

## Actions

| Need | Variant |
|------|---------|
| The one primary action | `default` |
| Cancel, secondary | `outline` or `secondary` |
| Toolbar, low emphasis | `ghost` |
| Delete, irreversible | `destructive`, placed apart from the primary button |
| Inline navigation | `link` |

Touch targets for primary and icon actions are at least 44px (`size="lg"` or `size="icon-lg"`). Default `h-9` is for dense admin toolbars only. Icon-only buttons need `aria-label`.

Place the primary action with the block it completes. A fixed bottom bar is only for a long screen where the action would otherwise leave the thumb.

## Forms

Visible label, hint, then error. Validate on blur, and again on submit. Phone and OTP fields are `dir="ltr"` so digits stay in order.

```tsx
<label htmlFor="phone">شماره موبایل</label>
<Input id="phone" type="tel" autoComplete="tel" dir="ltr" aria-invalid={Boolean(error)} aria-describedby="phone-error" />
<p id="phone-error" role="alert">{error}</p>
```

- Placeholder is a hint, not the label.
- The error sits under that field and includes how to fix it.
- While submitting, disable the button and show a pending label.

## Overlays

- `Dialog` for a short form or detail.
- `AlertDialog` for confirm or cancel. Use its action and cancel slots.
- `Tooltip` for an icon button. Do not use the `title` attribute as the tooltip.
