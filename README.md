# Pillar 5 Aptitude Test

Next.js 15 aptitude assessment for Pillar 5 — participant test flow, automatic scoring, top-3 role recommendations stored in Airtable, and staff admin dashboard.

## Stack

- **Next.js 15** + Tailwind CSS
- **Airtable** (server-side PAT only)
- **Auth.js** (master password for staff admin; Entra ID optional later)

## Setup

1. Copy `.env.example` to `.env.local` and fill in values.
2. Create the Airtable base per `docs/superpowers/specs/2026-07-20-p5-aptitude-design.md`.
3. Place `Pillar5_Aptitude_Test_Core_Design.xlsx` in the repo root (or pass path to import script).
4. Run `npm run import-workbook` (add `-- --sync-airtable` to push catalog to Airtable).
5. Run `npm run dev`.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run test` | Run unit tests |
| `npm run import-workbook` | Parse workbook → `lib/data/*.json` |

## Deployment

Deploy to Vercel from `P5-ICT/P5-aptitude`. Set env vars: `AIRTABLE_API_KEY`, `AIRTABLE_BASE_ID`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, `ADMIN_PASSWORD`.

Staff CSV export: use Airtable native table export (no custom export in admin).

## Record cap

At 500 participants × 84 answers ≈ 44k rows — requires Airtable Team/Pro (50k/base) or higher.
