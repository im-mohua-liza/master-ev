# Deployment Guide

This covers taking Jaman Enterprise from local development to a real,
always-on production website. This is a one-time (or occasional, for
updates) technical task — normal business use afterwards needs none of this.

## Overview of what changes for production

| Concern        | Local dev              | Production                                  |
|-----------------|------------------------|----------------------------------------------|
| Database        | SQLite (`prisma/dev.db`) | Postgres (managed, e.g. Neon/Supabase)      |
| File uploads     | `/public/uploads`      | Vercel Blob (or a persistent disk, see below) |
| Secrets          | `.env`                 | Host's environment variable settings          |
| URL              | `localhost:3000`       | your real domain                              |

## Recommended path: Vercel + Neon Postgres + Vercel Blob

This is the path the project's dependencies (`@vercel/blob`) are already
wired for.

### 1. Create a Postgres database

Use [Neon](https://neon.tech), [Supabase](https://supabase.com), or Vercel's
own Postgres add-on — any gives you a `postgresql://...` connection string.
Free tiers are fine for a single showroom's data volume.

### 2. Switch the Prisma datasource to Postgres

Edit `prisma/schema.prisma`:

```prisma
datasource db {
  provider = "postgresql"   // was "sqlite"
  url      = env("DATABASE_URL")
}
```

Delete the SQLite migration history and generate a fresh one against
Postgres (SQLite and Postgres migrations aren't compatible with each other):

```bash
rm -rf prisma/migrations
DATABASE_URL="postgresql://..." npx prisma migrate dev --name init
```

### 3. Create a Vercel Blob store

In the Vercel dashboard: Storage → Create → Blob. Copy the
`BLOB_READ_WRITE_TOKEN` it gives you — the upload API
(`src/app/api/upload/route.ts`) automatically switches to Blob storage
whenever this variable is set, no code changes needed.

### 4. Set environment variables on Vercel

In your Vercel project → Settings → Environment Variables, set:

- `DATABASE_URL` — the Postgres connection string from step 1
- `AUTH_SECRET` — generate a new one, **do not reuse the local dev one**:
  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
  ```
- `NEXTAUTH_URL` — your production URL, e.g. `https://jamanenterprise.com`
- `BLOB_READ_WRITE_TOKEN` — from step 3

### 5. Push to GitHub and import into Vercel

```bash
git init   # if not already a repo
git add .
git commit -m "Initial Jaman Enterprise system"
git remote add origin <your-repo-url>
git push -u origin main
```

Then in Vercel: New Project → Import your repo → Deploy. Vercel detects
Next.js automatically; no build configuration needed.

### 6. First run

Visit your production URL. Exactly like local dev, the first visit prompts
you to create the Owner account and complete the business setup wizard —
this is the one and only manual step; everything after is done from the
website.

## Alternative path: a persistent-disk host (Railway / Render / a VPS)

If you'd rather not deal with Blob storage, deploy to a host that keeps a
normal, persistent filesystem (Railway, Render, Fly.io, or your own VPS with
Docker/PM2). In that case:

- Skip the `BLOB_READ_WRITE_TOKEN` variable entirely — uploads fall back to
  writing straight into `/public/uploads`, same as local dev.
- Still switch to Postgres (steps 1–2 above) for real concurrent multi-user
  safety — SQLite is fine for local development but a single file isn't a
  good fit for a live multi-device business system.
- Mount a persistent volume for `/public/uploads` so uploaded photos/receipts
  survive redeploys.

## Backups

- **Database**: your Postgres provider (Neon/Supabase/etc.) takes automatic
  daily backups on all plans, including free tiers — check your provider's
  dashboard for the retention window and a one-click restore option.
- **Business-level export**: the app's own Reports Center (Settings are not
  needed — any Owner/Manager/Accountant login works) can export Sales,
  Inventory, Customers, Expenses, Payments, GST and Outstanding data as CSV
  at any time from inside the app, for the owner's own records.
- **Uploaded files**: Vercel Blob is backed by Vercel's storage
  infrastructure directly; for a persistent-disk host, back up the uploads
  folder however you already back up that server.

## Updating the app later

Ordinary business changes (adding scooters, staff, customers, changing
prices, GST rate, business details) never require a redeploy — they're all
data, edited from the website itself.

A redeploy is only needed when the *code* changes — a bug fix or a new
feature added by a developer. That's a normal `git push` to the connected
repo; Vercel rebuilds and deploys automatically. If the change includes a
database schema change, run `npx prisma migrate deploy` against the
production `DATABASE_URL` as part of that release.

## Troubleshooting

- **"Business profile not configured" on the invoice PDF** — the Owner
  needs to complete Settings → Business Profile (or the first-run setup
  wizard) at least once.
- **Uploaded images don't show up in production** — confirm
  `BLOB_READ_WRITE_TOKEN` is set in the deployment's environment variables
  (Vercel) or that the persistent volume is correctly mounted (other hosts).
- **Login works locally but not in production** — check `AUTH_SECRET` and
  `NEXTAUTH_URL` are set for the production environment specifically, not
  only in your local `.env`.
