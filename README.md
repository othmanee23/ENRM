# ENRM

ENRM is a French-language automotive oils catalogue and order-request website for Morocco. Customers browse exact product variants and submit a request with their phone number. ENRM administrators then contact customers and update each request’s status. The website does not collect payments.

## Current state

The public site uses Next.js App Router and React. Catalogue and product pages render on the server; product metadata and canonical URLs are generated from catalogue records. Supabase provides the database, authentication, storage, and order-request RPCs. Cloudflare Workers is the deployment target through OpenNext.

The storefront routes and shared controls are React components. `/admin` is guarded by a Next.js server-side auth check and has a JSX shell/navigation plus React-rendered orders, products, inventory, and customers tables. Category management and overview/analytics/promotions/settings rendering, editors, and some workflows still run through `src/admin/main.ts`, `src/admin/views.ts`, and `src/admin/categories.ts`. Root-level HTML entry pages and admin HTML fixtures have been removed. Legacy public URLs permanently redirect to Next.js routes. See [MIGRATION_REPORT.md](./MIGRATION_REPORT.md) and [PROJECT_STRUCTURE_AUDIT.md](./PROJECT_STRUCTURE_AUDIT.md) for implementation, structure, and verification history. The current branch is `fix/nextjs-migration`; a successful local build is not a production release.

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
npm run check:build    # Verify the generated Worker and packaged public assets
npm run preview        # Local Cloudflare Worker preview
npx wrangler deploy --dry-run
```

`npm run deploy` publishes to Cloudflare and must only be used for an explicitly approved release. Production deployment and database migrations are not part of the current migration work.

## Key locations

- `src/app/` — App Router layouts, public routes, metadata, sitemap, robots, cart, checkout, and admin entry point.
- `src/components/` — React storefront shell, cards, stateful cart controls, checkout, and React admin shell/list screens.
- `src/lib/` — catalogue reads, Supabase clients, SEO helpers, and product slug lookup.
- `src/admin/main.ts`, `src/admin/views.ts`, and `src/admin/categories.ts` — admin data workflows and feature screens still being migrated to React.
- `tests/` — domain, SEO, storefront, and admin workflow regression coverage.
- `public/catalogue.json` — fallback catalogue containing 210 preserved product variants.
- `public/assets/` — brand identity, images, fonts, and videos.
- `supabase/migrations/` — forward-only schema/security history; no production schema changes were made for this frontend migration.
- `tests/` — catalogue, storage, and browser workflow regression coverage.
- `PROJECT_DESCRIPTION.md` — detailed system, data, and operational description.
- `PROJECT_STRUCTURE_AUDIT.md` — current HTML, route, slug, architecture, admin migration, and security-boundary audit.

## Business and data rules

Product variants remain distinct by immutable database ID, formulation, and packaging size. Categories are database records, loaded dynamically, so authorized administrators can add categories without hard-coded storefront categories. Public catalogue reads use published rows and Supabase RLS. Order creation uses the existing `place_enrm_order` RPC, which remains authoritative for current prices, publication, stock, transactionality, and idempotency. Checkout asks for the customer’s name, phone, city, delivery address, and privacy acknowledgment. No payment gateway is used.

The admin’s orders, products, inventory, and category workflows use existing Supabase authorization and policies when connected. Customers and analytics derive from order data; promotions and shared settings are not configured as persistent features.

## Deployment

Cloudflare Worker configuration lives in `wrangler.jsonc`; OpenNext options live in `open-next.config.ts`. Production build variables must be changed to `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `NEXT_PUBLIC_SITE_URL` in the Cloudflare build environment before a future release. This repository migration does not change those dashboard settings, run a hosted migration, or deploy the Worker.
