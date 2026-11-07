# ENRM — storefront and demo administration

French ecommerce demonstration for ENRM, built with **TypeScript, Vite and native HTML/CSS interfaces**. The source is split into typed modules, shared HTML layouts and focused stylesheets. Production JavaScript and CSS are bundled, minified and content-hashed by Vite. No framework runtime is required.

## Run locally

Requires Node.js 22.22.2 or newer and npm.

```sh
npm ci
npm run dev
```

Open the URL printed by Vite. To inspect the production bundle:

```sh
npm run build
npm run preview
```

## Project structure

- `*.html`: the eleven page entry points, preserving existing `.html` URLs.
- `src/layout/`: the shared storefront header, footer and dialogs. The Vite layout plugin inserts these in development and production; edit each shared component once.
- `src/storefront/`: storefront bootstrap, product cards, product URL handling and motion lifecycle.
- `src/admin/`: admin bootstrap/editors, screen rendering, reusable UI fragments, icons, deterministic demo data and schema-validated persistence.
- `src/shared/`: domain types, catalogue loading/validation, safe text formatting, form helpers and cart storage validation.
- `src/styles/`: admin styles and storefront styles grouped by base layout, homepage, branding, motion, collections and catalogue. Imports retain cascade order.
- `public/catalogue.json`: the canonical catalogue, copied unchanged into production.
- `public/assets/`: local fonts, logos, product photography and videos. See `MEDIA_CREDITS.md` for provenance.
- `tests/`: data-integrity and workflow regression tests.
- `scripts/check-build.mjs`: validates all production pages, local resources and catalogue identities.
- `dist/`: generated production output, excluded from Git. Never edit it directly.

## Checks

```sh
npm run typecheck
npm test
npm run format:check
npm run build
```

TypeScript strict mode and unused-code checks are enabled. The tests cover catalogue integrity, exact variant media, malformed storage, saved data compatibility, catalogue filtering/reset, cart quantities, product volume changes, all admin screens, product creation and order stock deduction. Build checks verify eleven pages and all local resource paths. The GitHub Actions workflow runs formatting, tests and a production build.

## Features and URLs

- `/`: video hero, overlaid brand logos, scroll scenes and product collections.
- `/catalogue.html`: sidebar filters, normalized search, sorting, pagination and URL filter state.
- `/product.html?id=ENRM-HM-031`: exact variant/volume selection, photos, prices and persistent cart. Catalogue return filters stay in the URL.
- `/admin.html`: overview, orders, products, stock, customers, analytics, promotions, exports and local settings.
- About, advice, contact, delivery, returns, privacy and media credits retain their existing page URLs.

The catalogue has **210 original variants**. Product IDs, formulations, package volumes and image mappings are preserved. A 205 L drum and a 208 L drum remain separate variants. The complete catalogue is protected by a checksum regression test.

## Data persistence and demo boundaries

The cart uses `enrm-demo-cart`; admin data uses `enrm-admin-demo-v1`. Existing browser data remains compatible. Invalid cart entries are discarded, quantities are validated and duplicate entries are merged up to 99. Saved admin data is checked for valid relationships; locally created products from the earlier demo receive any missing catalogue fields.

Without Supabase credentials, the dashboard uses a browser-local demo dataset. Product photos remain local and are limited to 1 MB. CSV exports escape spreadsheet formulas; JSON backups contain the local demo data.

## Supabase catalogue foundation

The repository includes an independent local Supabase setup for the catalogue and product administration. Categories are records with stable IDs, slugs, ordering, active state, and an optional parent category. Each product points to a category ID, so the storefront filter options can be loaded from data rather than hard-coded. The initial seed assigns the existing 210 oil variants to “Huiles moteur.” Product edits and stock quantities are saved to Supabase for authorized admins. Stock is held in its own admin-only table and is not returned by public catalogue queries. Product photos use the public `product-media` bucket, with authenticated admin writes and a 1 MB limit.

Start the local backend with Docker running:

```sh
npm run backend:start
cp .env.example .env.local
```

Copy the local API URL and anon key from `npx supabase status` into `.env.local`, then run `npm run dev`. The storefront reads published products and active categories from Supabase when those variables are set. With no Supabase variables, it uses the unchanged static catalogue for preview. Never put a service-role key in browser environment variables.

`npm run backend:reset` rebuilds the **local** database from migrations and seed data. `npm run backend:lint` checks the local database schema. `npm run backend:seed` regenerates `supabase/seed.sql` from `public/catalogue.json`.

The admin has a Supabase-authenticated category manager at `/admin.html#categories`. It lets an authorized admin add, rename, reorder, show, or hide categories. The product editor supports assigning products to active categories and publishing/drafting them; inventory edits update private stock records. The database restricts category, product, stock, and media writes to an authenticated ENRM admin. New users default to the customer role. Create the account in Supabase Auth, then promote the approved account in the database dashboard with an owner-level SQL query such as `update public.profiles set role = 'admin' where lower(email) = lower('admin@example.com');`. Never assign admin roles from client-side code. When Supabase is configured, checkout submits a request to the database. A transaction validates the current published products, server-side prices, and stock, then saves the request and decrements inventory atomically. Payment and delivery terms remain unconfigured; the displayed subtotal is indicative. Order data is visible only to admins. The admin order-management screen, customer list, promotions, analytics, and settings remain demo-only. Complete the privacy, contact, and delivery details and review prices before opening the shop commercially.

## Accessibility and motion

Native forms and dialogs provide labels, validation and keyboard behavior. Reduced-motion preferences disable scroll motion and automatic playback; explicit playback remains available. Videos pause outside the viewport or when the document is hidden. Vertical scrolling remains native.

## Deployment

`vercel.json` declares the Vite build and `dist` output directory. Configure `VITE_SUPABASE_URL` and the anon key in the hosting project before publishing the database-backed catalogue. The repo is ready to link to Vercel, but the hosting project and runtime variables still need configuration.

```sh
npx vercel deploy --prod
```

No credentials belong in this repository. `.vercel/`, local environment files, dependencies, build output and review artifacts are excluded from Git.

## Research references

The admin feature scope was informed by [Shopify admin navigation](https://help.shopify.com/en/manual/shopify-admin/shopify-admin-overview) and [order analytics](https://help.shopify.com/en/manual/fulfillment/managing-orders/analytics/order-analytics). The build follows [Vite’s multi-page workflow](https://vite.dev/guide/build#multi-page-app) and [TypeScript strict checking](https://www.typescriptlang.org/tsconfig/strict).
