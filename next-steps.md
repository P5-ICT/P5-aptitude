# Next Steps — Pillar 5 Aptitude

The app scaffold is complete. Follow these steps to go from code to a working deployment.

---

## 1. Local environment

1. Copy `.env.example` to `.env.local`.
2. Fill in every required variable:

| Variable | Where to get it |
|----------|-----------------|
| `AIRTABLE_API_KEY` | Airtable Personal Access Token (scoped to your base only) |
| `AIRTABLE_BASE_ID` | Airtable base URL → `https://airtable.com/appXXXXXXXX/...` |
| `NEXTAUTH_URL` | `http://localhost:3000` for local dev |
| `NEXTAUTH_SECRET` | Run `openssl rand -base64 32` (or any long random string) |
| `GOOGLE_CLIENT_ID` | Google Cloud Console → OAuth 2.0 client |
| `GOOGLE_CLIENT_SECRET` | Same OAuth client |
| `STAFF_EMAIL_DOMAIN` | Optional — defaults to `pillar5group.co.za` |

3. Install and run:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## 2. Airtable base

1. Confirm your Airtable plan is **Team/Pro (50k records)** or higher before production (~44k rows at 500 participants).
2. Create a base named **P5 Aptitude** with all tables and fields — see [docs/airtable-base-setup.md](docs/airtable-base-setup.md).
3. Ensure **Submission Results** includes a **TopRoles** long-text field (JSON for ranked top 3 recommendations).
4. Create a Personal Access Token with read/write access to this base only.
5. Set `AIRTABLE_API_KEY` and `AIRTABLE_BASE_ID` in `.env.local`.

---

## 3. Catalog data (questions, roles, weights)

**Option A — Workbook (preferred when available)**

1. Place `Pillar5_Aptitude_Test_Core_Design.xlsx` in the repo root.
2. Run:

```bash
npm run import-workbook
```

3. To push catalog into Airtable:

```bash
npm run import-workbook -- --sync-airtable
```

**Option B — Seed data (already in repo)**

If the workbook is not available, `lib/data/*.json` already contains 84 questions and 12 roles. You can sync that catalog with:

```bash
npm run import-workbook -- --sync-airtable
```

---

## 4. Google OAuth (staff admin login)

1. In [Google Cloud Console](https://console.cloud.google.com/), create an OAuth 2.0 client (Web application).
2. Add authorized redirect URIs:
   - Local: `http://localhost:3000/api/auth/callback/google`
   - Production: `https://your-domain.vercel.app/api/auth/callback/google`
3. Copy Client ID and Client Secret into `.env.local`.
4. Only `@pillar5group.co.za` accounts (or your `STAFF_EMAIL_DOMAIN`) can sign in.

Test admin at [http://localhost:3000/admin/login](http://localhost:3000/admin/login).

---

## 5. UAT checklist (before production)

- [ ] Participant: register → complete all 9 sections → submit
- [ ] Results page shows top 3 role pathways
- [ ] Airtable **Submissions**, **Answers**, and **Submission Results** rows created
- [ ] **Submission Results.TopRoles** contains JSON with exactly 3 ranked recommendations
- [ ] No-consent path: status `rejected`, no results row
- [ ] Staff login works with allowed Google domain
- [ ] Admin list shows participant name, status, and primary top role
- [ ] Admin detail shows full top 3 + competency and role scores (from Airtable, not re-scored)
- [ ] Run `npm test` and `npm run build` — both pass

---

## 6. Deploy to Vercel

1. Push to `P5-ICT/P5-aptitude` on GitHub.
2. Connect the repo in Vercel (P5 org).
3. Set all env vars from `.env.example` in Vercel project settings.
4. Update `NEXTAUTH_URL` to your production URL.
5. Add production Google OAuth redirect URI in Google Cloud Console.
6. Deploy from `main`; use preview URLs for PR testing.

---

## 7. After go-live

- Export participant data via **Airtable native CSV export** (no custom export in admin).
- Monitor Airtable record count as participants complete assessments.
- Tune scoring in UAT if needed (secondary competency weight 50%, exposure bonuses).

---

## Reference docs

- [Implementation plan](.cursor/plans/p5-aptitude-implementation.plan.md)
- [Design spec](docs/superpowers/specs/2026-07-20-p5-aptitude-design.md)
- [Airtable base setup](docs/airtable-base-setup.md)
- [README](README.md)
