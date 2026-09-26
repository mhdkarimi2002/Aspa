# UX

## Forms

- Validate on blur. After a failed submit, focus the first invalid field.
- Errors say what is wrong and how to fix it. Expose them with `role="alert"` or `aria-live`.
- Mark required fields. Group related fields.
- Operations longer than 300ms show a skeleton or a disabled pending button. Do not leave the view blank.

## Keyboard and contrast

- Never remove the focus ring. shadcn `focus-visible:ring-*` stays.
- Tab order follows visual order.
- Body text on its surface meets 4.5:1. Large text and icons meet 3:1.
- Status uses icon or text plus color.

## RTL and Persian

The product locale is Persian. New UI uses logical properties: `ps`, `pe`, `ms`, `me`, `text-start`, `text-end`.

- `dir` follows the active locale. Do not hardcode `dir="ltr"` on a page.
- Back navigation stays predictable. Do not reset scroll or form state on back.
- Admin shells: sidebar from `lg` up, a short top bar below that. Bottom navigation stays at 5 items or fewer, each with icon and label.

## Motion

One or two moving elements per view. Page changes do not wait on a slow request; show loading in the destination. Exit transitions are shorter than enter transitions.
