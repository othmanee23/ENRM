# ENRM Project Description

_Last updated: 7 November 2026_

## Project at a glance

ENRM is a French-language storefront and lightweight administration app for browsing and requesting automotive oils and related products in Morocco. It is built as a multi-page TypeScript application with Vite, native HTML, and CSS. Supabase provides the hosted catalogue, authentication, product inventory, and real customer order requests. Cloudflare Workers Static Assets serves the production site and deploys from the GitHub repository.

The storefront does not collect payment. A customer submits a request with their name, phone number, city, delivery address, and chosen products. The ENRM team contacts the customer to confirm stock, price, and delivery, then updates the request status in the admin area.

## Goals and users

- **Customers** browse product variants, compare details, add items to a cart, and send an order request for follow-up by ENRM.
- **ENRM administrators** maintain catalogue categories, products, publication state, and stock; review incoming requests; contact customers by phone; and track status, delivery tracking, notes, and status history.
- **The project owner** can expand the catalogue over time by adding categories and assigning products to them, without adding category names to front-end code.

The current visual identity and page content are in French. Prices are in Moroccan dirhams (MAD).

## Storefront pages

| URL | Purpose |
| --- | --- |
| `/` or `/index.html` | Brand homepage with video-led hero, brand marks, featured products, and category or viscosity entry points. |
| `/catalogue.html` | Product listing with search, filters, sorting, pagination, and URL-backed filter state. |
| `/product.html?id=<product-id>` | Detail page for a specific catalogue variant, including packaging selection, price, product imagery, and add-to-cart actions. |
| `/conseil.html` | Vehicle oil guidance content and advice form. |
| `/contact.html` | Contact page. |
| `/a-propos.html` | About ENRM. |
| `/livraison.html` | Delivery information. |
| `/retours.html` | Returns and terms information. |
| `/confidentialite.html` | Privacy information for customer data submitted with an order request. |
| `/credits.html` | Media and asset credits. |
| `/admin.html` | Administration interface; routes include `#overview`, `#orders`, `#products`, `#categories`, `#inventory`, `#customers`, `#analytics`, `#promotions`, and `#settings`. |

The current catalogue preserves **210 distinct product variants** and their IDs, formulations, packaging sizes, and image associations. Different package sizes and drum sizes remain separate SKUs. Product photos, brand marks, fonts, and video files are stored under `public/assets/` and accompanied by `MEDIA_CREDITS.md`.

## Customer order-request flow

1. A visitor browses the published catalogue and adds available variants to the cart.
2. Checkout collects the visitor’s name, phone number, city, and requested delivery address. The user acknowledges the privacy information before submitting.
3. The site sends product IDs and quantities to the Supabase `place_enrm_order` database function. The database re-reads the current catalogue prices, validates publication and category visibility, checks available stock, and creates the request and line items in one transaction.
4. Inventory is reserved by decrementing stock when a request is accepted. A duplicate request ID is handled idempotently to avoid creating the same order twice.
5. A request starts in **À confirmer**. An administrator contacts the customer to confirm the request and follows up on availability, final price, and delivery.
6. The admin can move it through **À confirmer**, **À préparer**, **En préparation**, **Expédiée**, **Livrée**, and **Annulée**; add a tracking number or internal note; and see the saved status timeline. Cancelling a request restores its reserved stock once. A cancelled request cannot be reactivated.

There is no customer-side payment, payment gateway, or payment collection. Delivery fees and final totals are not calculated at checkout; displayed totals are indicative and must be confirmed by ENRM with the customer.

## Administration

- **Overview:** operational summary, recent requests, catalogue activity, and low-stock indicators. When Supabase admin access is active, order and inventory summaries are based on hosted data.
- **Orders:** search and filter real order requests; view customer contact and delivery details, line items, indicative total, status history, tracking number, and internal note; update status through a secured database function; export rows.
- **Products:** add and edit product variants, category, MAD price, publication status, and product image. Images uploaded from admin are stored in Supabase Storage.
- **Categories:** add, rename, reorder, and show or hide categories. Category names and filters are loaded from the database. The database model includes an optional parent-category relationship for future hierarchy.
- **Stock & inventory:** edit quantities and see low-stock or out-of-stock items. Inventory is private to authorized administrators and is not included in public catalogue queries.
- **Customers, analytics, promotions, and some settings:** these are currently browser-local/demo features rather than hosted business records. They should not be treated as authoritative commercial data yet.

## Application architecture

### Front end

- Vite builds eleven HTML entry pages into `dist/`, keeping the existing `.html` URLs.
- TypeScript is in strict mode. Storefront, admin, and shared modules are separated by purpose.
- Shared header, footer, and dialog markup is sourced from `src/layout/` and inserted by the Vite layout plugin.
- CSS is organized into storefront foundation, branding, homepage, catalogue, collections, storytelling, motion, and admin stylesheets.
- The app uses native browser APIs rather than a front-end framework runtime.
- Cart data is stored locally in the visitor’s browser and validated when read.
- Motion respects reduced-motion settings. Video playback pauses when content is out of view or the document is hidden.

### Supabase data layer

The browser creates a Supabase client only when both `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are present at build time. Without them, the app can use the static catalogue and browser-local demo behavior; the production Cloudflare build has these public browser variables configured.

The hosted schema is created by sequential migrations under `supabase/migrations/`:

- `profiles`: role information linked to Supabase Auth users. New users receive the `customer` role; administrator role assignment is performed through trusted project administration.
- `categories`: stable UUID, optional parent ID, unique slug, name, ordering, and active state. Products reference category IDs rather than hard-coded labels.
- `products`: original product IDs and catalogue details, price, publication flags, image references, and source/provenance notes.
- `product_inventory`: a separate quantity table with non-negative stock and admin-only access.
- `orders` and `order_items`: contact and delivery details, request status, product snapshots, prices, quantities, and indicative totals.
- `order_status_history`: append-only-by-trigger history of initial status and subsequent status changes.
- `product-media` storage bucket: public image reads; admin-authenticated uploads, updates, and deletes; JPEG, PNG, and WebP images up to 1 MB.

Row-level security limits product/category writes and inventory/order access to authenticated ENRM administrators. Public visitors can read active categories and published products. Public users submit an order through a database function; they do not receive direct table access to customer orders.

## Category scalability

Categories are database records, not a fixed list in the storefront. Each product points to a category by its stable `category_id`; each category has a unique URL slug, display order, active state, and optional parent. The catalogue loads active categories dynamically, and the admin category manager lets an authorized administrator add more category records. This allows future families such as filters, fluids, or accessories to be introduced as data and assigned to products without rewriting the category navigation for each new family.

The current admin form manages top-level category records; although the schema has a `parent_id`, editing a nested hierarchy is not yet exposed in that form.

## Security and customer-data handling

- The browser receives only Supabase’s public anon key. Never put a Supabase service-role key in Vite variables or front-end code.
- Admin authorization is checked against the authenticated Supabase profile and enforced again in database policies/functions. When Supabase is configured, unauthenticated visitors and non-admin accounts are routed to the administrator sign-in/access screen instead of the demo dashboard. Without Supabase credentials, the local demo admin remains available for development.
- Stock is stored separately from public product data.
- Order submissions validate fields and quantities in both the client and database. Database-side prices and stock are authoritative.
- Checkout explains that the request sends contact details to ENRM and asks the customer to acknowledge the privacy information.
- Admin CSV exports escape spreadsheet formulas; uploaded images have type and size restrictions.

## Current production hosting

- **Source repository:** `https://github.com/othmanee23/ENRM`
- **Production branch:** `main`
- **Build:** `npm run build` (TypeScript check, Vite production bundle, then build integrity checks)
- **Deploy:** `npx wrangler deploy`
- **Cloudflare config:** `wrangler.jsonc` serves `dist/` as Worker static assets.
- **Hosted backend:** Supabase project, with production URL and anon key configured as Cloudflare build variables.
- **Temporary public URL:** `https://enrm.othmane-dev.workers.dev`
- **Custom domain:** `enrm.ma` is an active Cloudflare zone and is attached to the `enrm` Worker. The assigned Cloudflare nameservers are `charles.ns.cloudflare.com` and `desi.ns.cloudflare.com`. Supabase’s Site URL is set to `https://enrm.ma`. At the last browser check, the custom domain TLS handshake was still failing, so allow Cloudflare certificate provisioning to finish before considering the hostname fully verified.

Cloudflare builds the connected GitHub project and runs the configured production build/deploy commands. Do not commit local `.env` files or credentials. The `VITE_` values are included in the browser bundle by design; only public Supabase URL and anon key belong there.

## Local development

Requires Node.js `22.22.2` or newer and npm.

```sh
npm ci
cp .env.example .env.local
npm run dev
```

Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in `.env.local` for local access to the hosted backend. Keep the file untracked. Local static/demo behavior can be used without Supabase variables.

Useful commands:

```sh
npm run typecheck
npm test
npm run format:check
npm run build
npm run backend:start
npm run backend:status
npm run backend:reset  # resets only the local Supabase database
npm run backend:lint
npm run backend:seed
```

`npm run backend:reset` is destructive to the local Docker database; it does not reset the hosted Supabase project. The canonical imported catalogue is `public/catalogue.json`; the seed generator writes the SQL seed to `supabase/seed.sql`.

## Repository map

- `*.html` — multi-page storefront and admin page entry points.
- `src/layout/` — shared page chrome and dialogs.
- `src/storefront/` — storefront bootstrap, cards, motion, and URL routing.
- `src/admin/` — dashboard, category manager, product/order workflows, exports, and demo fixtures.
- `src/shared/` — types, Supabase client, catalogue/category/order reads, formatting, DOM helpers, and local storage validation.
- `src/styles/` — storefront and admin styles.
- `public/catalogue.json` — canonical source catalogue.
- `public/assets/` — product images, branding, fonts, and media.
- `supabase/migrations/` — hosted schema and security policies.
- `supabase/seed.sql`, `scripts/generate-supabase-seed.mjs` — initial catalogue seed and generator.
- `tests/` — domain and workflow regression tests.
- `scripts/check-build.mjs` — production output, route, asset, and catalogue consistency checks.
- `wrangler.jsonc` — Cloudflare Worker static-assets deployment settings.
- `vercel.json` — legacy hosting config retained in the repository; production hosting is Cloudflare.
- `MEDIA_CREDITS.md` — image, video, font, and logo attribution notes.

## Launch-readiness notes

The deployment is online, but the existing project documentation and seeded catalogue describe demo/indicative commercial information. Before accepting real customer requests, ENRM should review and confirm:

1. Every displayed price and all product descriptions/variant compatibility claims.
2. Actual stock quantities; new inventory rows start at zero, so order requests for those items will fail stock checks until stock is entered.
3. Delivery coverage, fees, timing, and customer-facing delivery/returns/privacy/contact text.
4. Product publication state and the product photos/provenance for each item.
5. The custom domain activation and production authentication URL once `enrm.ma` is connected.

The order workflow is designed for manual customer follow-up by an administrator. It is not an automated payment, fulfillment, shipping-rate, or customer-account checkout system.
