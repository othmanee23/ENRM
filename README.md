# ENRM

ENRM is a French-language automotive oils catalogue and order-request website for Morocco. Customers browse exact product variants and submit a request with their phone number. ENRM administrators then contact customers and update each request’s status. The website does not collect payments.

## Current state

The public site uses Next.js App Router and React. Catalogue and product pages render on the server; product metadata and canonical URLs are generated from catalogue records. Supabase provides the database, authentication, storage, and order-request RPCs. Cloudflare Workers is the deployment target through OpenNext.

The storefront routes and shared controls are React components. `/admin` is guarded by a Next.js server-side auth check and has React-rendered screens and modal editors. `src/admin/main.tsx` coordinates data loading and existing mutation workflows; sensitive product, order, and category writes still use the established Supabase RPC/RLS boundary. Root-level HTML entry pages and admin HTML fixtures have been removed. Legacy public URLs permanently redirect to Next.js routes. See [MIGRATION_REPORT.md](./MIGRATION_REPORT.md) and [PROJECT_STRUCTURE_AUDIT.md](./PROJECT_STRUCTURE_AUDIT.md) for implementation, structure, and verification history.

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

Use `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `NEXT_PUBLIC_SITE_URL` in `.env.local`. For local work, point Supabase URL/key to the local `supabase start` instance; use separate production values only in `.env.production.local` or the Cloudflare production build environment. Both env files are ignored by Git. Only the public anon key belongs in client configuration; never expose a service-role key. Without Supabase configuration, the app uses the checked-in catalogue for browsing and disables real order submission. For local password recovery, allow the matching local `/reset-password` URL in Supabase Authentication → URL Configuration → Redirect URLs.

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

`npm run deploy` publishes to the existing Cloudflare Worker and must only be used for an explicitly approved release. It does not run Supabase migrations.

## Key locations

- `src/app/` — App Router layouts, public routes, metadata, sitemap, robots, cart, checkout, and admin entry point.
- `src/components/` — React storefront shell, cards, stateful cart controls, checkout, and admin screens.
- `src/lib/` — catalogue reads, Supabase clients, SEO helpers, and product slug lookup.
- `src/admin/main.tsx` — admin data coordinator and editor save workflows.
- `src/components/admin/AdminEditorHost.tsx` — React modal host for admin editors and alerts.
- `tests/` — domain, SEO, storefront, and admin workflow regression coverage.
- `public/catalogue.json` — fallback catalogue containing 210 preserved product variants.
- `public/assets/` — brand identity, images, fonts, and videos.
- `supabase/migrations/` — forward-only database schema and security changes, applied separately from Worker releases.
- `PROJECT_DESCRIPTION.md` — detailed system, data, and operational description.
- `PROJECT_STRUCTURE_AUDIT.md` — current HTML, route, slug, architecture, admin migration, and security-boundary audit.

## Business and data rules

Product variants remain distinct by immutable database ID, formulation, and packaging size. Categories are database records, loaded dynamically, so authorized administrators can add categories without hard-coded storefront categories. Public catalogue reads use published rows and Supabase RLS. Order creation uses the existing `place_enrm_order` RPC, which remains authoritative for current prices, publication, stock, transactionality, and idempotency. Checkout asks for the customer’s name, phone, city, delivery address, and privacy acknowledgment. No payment gateway is used.

The admin’s orders, products, inventory, and category workflows use existing Supabase authorization and policies when connected. Customers and analytics derive from order data; promotions and shared settings are not configured as persistent features.

## Deployment

Cloudflare Worker `enrm` serves `enrm.ma`. Worker configuration lives in `wrangler.jsonc`; OpenNext options live in `open-next.config.ts`. Cloudflare deployments are manual Wrangler releases; Git branches do not deploy automatically. `main` is the canonical source for production releases. Merge changes through pull requests, wait for all project checks, then build and deploy from a clean `main` checkout when a release is explicitly approved.

Before a release, verify that the Cloudflare build environment has `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `NEXT_PUBLIC_SITE_URL` configured. Only the public anon key belongs in client configuration; never use the Supabase service-role key in this app. Database migrations are a separate release step: review the pending migration files, confirm the target Supabase project, apply them through the approved Supabase workflow, and verify the resulting schema before deploying code that depends on them.
