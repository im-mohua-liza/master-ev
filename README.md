# Jaman Enterprise — EV Scooter Showroom Management System

A complete business management system for an Indian EV scooter dealership:
inventory, sales & GST invoicing, customers, leads, test rides, bookings,
payments, expenses, service records, profit & loss, and reports — built as
one Next.js application with its own database, so the business can be run
entirely from a web browser after deployment.

For **daily business operation**, see [`OWNER_GUIDE.md`](./OWNER_GUIDE.md) —
written for the showroom owner/staff, no technical knowledge required.

For **deployment / hosting**, see [`DEPLOYMENT.md`](./DEPLOYMENT.md).

## Tech stack

- **Framework:** Next.js 16 (App Router, TypeScript, Turbopack)
- **Database:** SQLite for local development, Postgres in production — via
  [Prisma ORM](https://www.prisma.io) (schema in `prisma/schema.prisma`)
- **Auth:** [Auth.js / NextAuth v5](https://authjs.dev) with credentials
  (email + password) login, JWT sessions, role-based access control
- **UI:** React 19, Tailwind CSS v4
- **PDF invoices:** `@react-pdf/renderer`
- **Charts:** Recharts
- **File uploads:** local disk in dev, Vercel Blob in production (see
  `src/app/api/upload/route.ts`)

## Local development

```bash
npm install
cp .env.example .env      # then edit AUTH_SECRET etc. if needed
npx prisma migrate dev    # creates prisma/dev.db and applies the schema
npm run dev
```

Open http://localhost:3000 — the first visit walks you through creating the
Owner account and the business setup wizard.

## Project structure

```
prisma/schema.prisma       Database schema (single source of truth)
src/auth.ts                 NextAuth configuration
src/proxy.ts                 Route protection + role-based access (Next.js
                             16 renamed "middleware" to "proxy")
src/lib/                    Business logic: GST/sale math, codes/invoice
                             numbering, P&L, dashboard aggregation, roles
src/app/api/                 REST-ish route handlers (all mutations go
                             through here — validated with zod, audit-logged)
src/app/(app)/               Authenticated app pages (dashboard, inventory,
                             sales, customers, settings, ...)
src/app/login, /bootstrap,
/setup                      Public/onboarding pages
src/components/             Shared UI (forms, nav shell, charts, tables)
```

## Key design decisions worth knowing before extending this code

- **Money** is stored as `Float` rupees, rounded to 2dp at every calculation
  step (`src/lib/money.ts`). This was a pragmatic choice for SQLite (which
  has no native `Decimal` type); if you migrate to Postgres you could switch
  these columns to `Decimal` for extra precision, but it is not required.
- **GST math** (`src/lib/sale-calc.ts`) treats a vehicle's listed selling
  price as GST-inclusive, applies the discount to that inclusive price, then
  derives the taxable value and GST from the result. This mirrors how
  ex-showroom EV pricing is normally quoted to a customer. GST rate is a
  per-vehicle field, never hard-coded, so it can be corrected as GST rules
  change — see Settings and the vehicle/model forms.
- **Role permissions** are enforced twice: once in `src/proxy.ts` (blocks
  whole page sections by URL prefix) and again inside each API route handler
  (`requireSession([...roles])`). Both must be kept in sync with
  `src/lib/roles.ts` when adding new modules.
- **Audit log**: every create/update/delete/cancel that matters is written
  to the `AuditLog` table via `src/lib/audit.ts`. Financial records
  (sales, vehicles once sold) are never hard-deleted — they're cancelled/
  archived instead, per the spec's requirement to preserve history.
- **Demo data** is separate from real data via an `isDemo` flag on the
  relevant tables (`src/lib/demo-data.ts`), toggled from Settings → Demo
  Data in the app — no CLI required for the business owner.

## Scripts

```bash
npm run dev      # start dev server (Turbopack)
npm run build    # production build
npm run start    # run a production build
npx prisma studio         # visual DB browser (dev only)
npx prisma migrate dev    # create/apply a new migration after schema changes
```
