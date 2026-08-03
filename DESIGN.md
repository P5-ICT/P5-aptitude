# Design

Visual system for the Pillar 5 Aptitude Test. Product register — design serves the assessment workflow.

## Color strategy

**Committed** — navy carries brand chrome; teal for primary actions; gold for emphasis only.

| Token | Role | Value |
|-------|------|-------|
| `--p5-navy` | Brand chrome, headings, primary buttons | `#0b1f3a` |
| `--p5-teal` | Actions, links, progress | `#1a8f8f` |
| `--p5-gold` | Accent emphasis (sparingly) | `#c9a227` |
| `--p5-bg` | Page background | `oklch(0.98 0.005 250)` — cool off-white, not cream |
| `--p5-surface` | Cards, inputs | `oklch(1 0 0)` |
| `--p5-ink` | Body text | `#1a1a1a` |
| `--p5-muted` | Secondary text | `oklch(0.45 0.02 250)` |
| `--p5-border` | Borders | `oklch(0.88 0.01 250)` |

Body background is a true off-white with a slight navy hue tint — not warm sand (`#f4efe6`).

## Typography

- **Display:** Source Serif 4 — institutional serif for headings and brand wordmark.
- **Body:** Source Sans 3 — clear humanist sans for forms, questions, and admin tables.
- Loaded via `next/font/google` in root layout.
- Display headings: `text-wrap: balance`, letter-spacing ≥ `-0.04em` max.
- Body line length capped at ~65ch in prose areas.

## Spacing and layout

- Max content width: `max-w-5xl` (landing), `max-w-2xl` (test), `max-w-6xl` (admin).
- Section rhythm via `clamp()` vertical padding.
- Flexbox for 1D nav/controls; grid only where 2D layout is needed.

## Components

| Component | Location | Purpose |
|-----------|----------|---------|
| `Button` | `components/ui/button.tsx` | Primary, secondary, ghost variants |
| `Field` | `components/ui/field.tsx` | Label + input + error |
| `Progress` | `components/ui/progress.tsx` | Section progress bar |
| `OptionChoice` | `components/ui/option-choice.tsx` | Radio option in test wizard |
| `SiteHeader` | `components/site-header.tsx` | Participant chrome |
| `AdminHeader` | `components/features/admin/admin-header.tsx` | Shared admin nav |

## Motion

1. Page content fade-in on mount (opacity + translateY, 400ms ease-out).
2. Progress bar width transition on section change.
3. CTA hover: subtle background shift, no bounce.

All animations disabled under `prefers-reduced-motion: reduce`.

## Bans

- No gradient text
- No side-stripe accent borders
- No uppercase tracked eyebrows on every section
- No ghost cards (border + shadow ≥16px blur)
- Border radius ≤16px on surfaces (12px default)
- No decorative grid/stripe backgrounds

## Surfaces

- **Landing:** Full-bleed navy atmosphere; Pillar 5 as hero-level brand signal.
- **Register / test / results:** Light bg (`--p5-bg`), white surfaces, teal accents.
- **Admin:** Navy header, dense tables, minimal decoration.
