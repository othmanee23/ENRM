# ENRM — storefront and demo administration

French ecommerce demonstration for ENRM, built with **TypeScript, Vite and native HTML/CSS interfaces**. The source is split into typed modules, shared HTML layouts and focused stylesheets. Production JavaScript and CSS are bundled, minified and content-hashed by Vite. No framework runtime is required.

## Run locally

Requires Node.js 22.12 or newer and npm.

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

The dashboard uses a separate local dataset. Its product edits do not change the public catalogue. Orders, customers, revenue, stock and promotions are fictitious. No payment, shipment, message or real order is sent. Product photos uploaded in the dashboard are stored locally and limited to 1 MB. CSV exports escape spreadsheet formulas; JSON backups contain the local demo data.

There is no backend or admin authentication. A commercial version requires server-side authentication, authorization, durable storage and integrations. Use fictional personal data in this demonstration.

## Accessibility and motion

Native forms and dialogs provide labels, validation and keyboard behavior. Reduced-motion preferences disable scroll motion and automatic playback; explicit playback remains available. Videos pause outside the viewport or when the document is hidden. Vertical scrolling remains native.

## Deployment

The project is linked to Vercel. `vercel.json` declares Vite, `npm run build` and the `dist` output directory. The production build must pass strict type checking and resource validation before Vercel publishes it.

```sh
npx vercel deploy --prod
```

No credentials belong in this repository. `.vercel/`, local environment files, dependencies, build output and review artifacts are excluded from Git.

## Research references

The admin feature scope was informed by [Shopify admin navigation](https://help.shopify.com/en/manual/shopify-admin/shopify-admin-overview) and [order analytics](https://help.shopify.com/en/manual/fulfillment/managing-orders/analytics/order-analytics). The build follows [Vite’s multi-page workflow](https://vite.dev/guide/build#multi-page-app) and [TypeScript strict checking](https://www.typescriptlang.org/tsconfig/strict).
