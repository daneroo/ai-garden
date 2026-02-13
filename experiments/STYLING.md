# Styling Reference

Reusable visual-system defaults for web experiments. Seeds can reference this and
override per-project as needed.

## Baseline Theme Direction

- Prefer a deliberate palette over default framework styles.
- For dark-shell reader/player apps, a `slate` hierarchy works well:
  - `bg-slate-900`: page background
  - `bg-slate-800`: cards/panels/controls
  - `bg-slate-700`: active states
  - `border-slate-700` and `border-slate-600`: structural separators/inputs
  - `text-white`, `text-slate-300`, `text-slate-400`, `text-slate-500`: text
    hierarchy

## Practical Patterns

- Keep the reading surface high contrast against shell (for example white reader
  surface on dark shell).
- Use `tabular-nums` for time displays to prevent layout jitter.
- Use subtle `transition-colors` on hoverable cards; avoid over-animating
  utility UI.
- Keep media/control accents in-palette (for example `accent-slate-400`).

## Layout Guidance

- Keep layout guidance generic in this doc.
- Put page-specific layout patterns in each seed (for example `seeds/bookplayer.md`).

## Verification Checklist

- Desktop and mobile both usable.
- Keyboard focus visible on controls and links.
- No starter visual branding remains after cleanup.
