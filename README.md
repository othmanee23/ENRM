# ENRM

ENRM is a French-language automotive oils catalogue and order-request website for Morocco. Customers browse exact product variants and submit a request with their phone number. ENRM administrators then contact customers and update each request’s status. The website does not collect payments.

## Current migration state

The project is being migrated from Vite and direct DOM scripts to Next.js App Router. The current branch is `fix/nextjs-migration`. Next routes, server rendering, metadata, structured product URLs, cart and checkout pages, and the Cloudflare OpenNext Worker build are in place. Existing storefront and administration screens still use a generated HTML and DOM compatibility runtime in parts of the app; see [MIGRATION_REPORT.md](./MIGRATION_REPORT.md) for remaining work. Do not treat this branch as a production cutover.

## Stack

- Next.js App Router, React, and strict TypeScript
- Tailwind CSS 4 (alongside the retained ENRM CSS during migration)
- Supabase PostgreSQL, Auth, Storage, RLS, and existing order RPCs
- Cloudflare Workers using the OpenNext Cloudflare adapter
- Vitest and jsdom for domain and workflow regression tests

## Local development

Requires Node.js 22.22.2 or newer.

```sh
npm ci
cp .env.example .env.local
npm run dev
```

Use `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `NEXT_PUBLIC_SITE_URL` in `.env.local`. Only the public anon key belongs in client configuration; never expose a service-role key. Without Supabase configuration, the app uses the checked-in catalogue for browsing and disables real order submission. For local password recovery, allow `http://localhost:3000/reset-password` in Supabase Authentication → URL Configuration → Redirect URLs.

## Commands

```sh
npm run typecheck
npm test
npm run build          # Next build plus OpenNext Worker bundle
npm run build:next     # Next build only
npm run preview        # Local Cloudflare Worker preview
npx wrangler deploy --dry-run
```

`npm run deploy` publishes to Cloudflare and must only be used for an explicitly approved release. Production deployment and database migrations are not part of the current migration work.

## Key locations

- `src/app/` — App Router layouts, public routes, metadata, sitemap, robots, cart, checkout, and admin entry point.
- `src/components/` — shared storefront shell, server-rendered legacy markup wrapper, and cart/checkout client components.
- `src/lib/` — server-only catalogue reads, public Supabase clients, rendering helpers, and product slug lookup.
- `src/storefront/`, `src/admin/`, `src/shared/` — existing feature logic being migrated; some modules still drive the compatibility screens.
- `public/catalogue.json` — fallback catalogue containing 210 preserved product variants.
- `public/assets/` — brand identity, images, fonts, and videos.
- `supabase/migrations/` — forward-only schema/security history; no production schema changes were made for this frontend migration.
- `tests/` — catalogue, storage, and browser workflow regression coverage.
- `PROJECT_DESCRIPTION.md` — detailed system, data, and operational description.

## Business and data rules

Product variants remain distinct by immutable database ID, formulation, and packaging size. Categories are database records, loaded dynamically, so authorized administrators can add categories without hard-coded storefront categories. Public catalogue reads use published rows and Supabase RLS. Order creation uses the existing `place_enrm_order` RPC, which remains authoritative for current prices, publication, stock, transactionality, and idempotency. Checkout asks for the customer’s name, phone, city, delivery address, and privacy acknowledgment. No payment gateway is used.

The admin’s orders, products, inventory, and category workflows use existing Supabase authorization and policies when connected. Customers, analytics, promotions, and some settings remain demo-only in the legacy admin and are not authoritative hosted records.

## Deployment

Cloudflare Worker configuration lives in `wrangler.jsonc`; OpenNext options live in `open-next.config.ts`. Production build variables must be changed to `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `NEXT_PUBLIC_SITE_URL` in the Cloudflare build environment before a future release. This repository migration does not change those dashboard settings, run a hosted migration, or deploy the Worker.
