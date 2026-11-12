# ENRM Project Structure, HTML, Routes, and Slugs Audit

**Reviewed:** 2026-11-12  
**Branch:** `fix/nextjs-migration`  
**Scope:** repository structure, physical HTML files, URL compatibility, product slug handling, current storefront/admin rendering, and local verification.  
**Decision:** coherent Next.js migration baseline; admin migration and hosted release verification remain open.

## What the project is now

ENRM is a Next.js App Router application using React and strict TypeScript. Next.js renders public pages and product data; Supabase is the database/auth/storage system; OpenNext packages the app as a Cloudflare Worker. The order flow is a customer request: the customer gives contact and delivery details, then an administrator contacts them and updates status. There is no user payment flow.

The project is under `Desktop/projects/enrm`, on `fix/nextjs-migration`. Local commits may be ahead of GitHub; repository publication and Cloudflare deployment are separate actions and are not implied by this audit.

## HTML files: why they used to exist and what remains

The old site used standalone `.html` entry pages and shared HTML fragments. That was normal for the former Vite implementation, but it is no longer how page routes are authored. Root HTML entries, `admin.html`, the generated legacy-page module, its generator, and admin HTML test fixture have been removed.

There are currently no tracked `*.html` files in the application source/public tree. Next.js still returns HTML documents to browsers, of course; that response format is not a source `.html` file. The route `src/app/(storefront)/product.html/page.tsx` is a TypeScript compatibility handler whose URL includes `.html`; it redirects old `/product.html?id=...` bookmarks to the canonical product URL. `next.config.ts` retains permanent redirects for older public `.html` paths.

Do not remove those URL redirects without checking access logs/Search Console and deciding how long old bookmarks and search results must continue working. They are routing compatibility, not evidence the application still runs on Vite.

## Route map

| Purpose                | Current route                                                                                 | Notes                                                                                 |
| ---------------------- | --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Home                   | `/`                                                                                           | React/Next server-rendered storefront                                                 |
| Browse                 | `/catalogue`                                                                                  | Server query filters, category facets, React controls/cards                           |
| Product                | `/produits/{descriptive-label--PRODUCT-ID}`                                                   | Public record resolved by immutable ID and redirected to canonical slug               |
| Legacy product         | `/product.html?id=...`                                                                        | Compatibility route, redirects to canonical product URL                               |
| Cart and order request | `/panier`, `/commande`                                                                        | React cart/checkout; no payment                                                       |
| Information            | `/a-propos`, `/conseil`, `/contact`, `/livraison`, `/retours`, `/confidentialite`, `/credits` | Next.js App Router pages                                                              |
| Admin login/recovery   | `/login`, `/reset-password`                                                                   | Supabase Auth, private/no-store behavior                                              |
| Administration         | `/admin#overview`, `/admin#orders`, etc.                                                      | One App Router route with hash-based feature navigation; not `/admin/orders` paths    |
| Search engines         | `/robots.txt`, `/sitemap.xml`                                                                 | Next.js metadata routes; indexing is gated by canonical production site configuration |

## Product slugs and category slugs

Product URLs use a readable normalized label plus `--` and the stable catalogue ID. The ID prevents collisions between otherwise identical product names and preserves exact packaging variants. The resolver extracts the ID, queries only published/visible products, and the page compares the requested URL to the computed canonical slug. A wrong or stale description with a valid visible ID receives a permanent redirect; missing, malformed, unpublished, or unknown IDs return not-found. Legacy `product.html?id` URLs resolve by ID and redirect as well.

Category URLs use database `categories.slug` values for catalogue filtering. Products point to categories by stable `category_id`, not display names. Category management supports adding and editing categories and visibility/order; new top-level categories are data-driven and do not require frontend code changes. The schema has `parent_id`, but the current admin interface does not expose parent/child editing. Slug uniqueness and referential integrity are ultimately database constraints; admins should treat an ID already assigned to products as stable and avoid deleting categories in use.

## Source tree map

| Path                                            | Responsibility                                                                                         |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `src/app/`                                      | Next.js routes, layouts, metadata and route-level server rendering                                     |
| `src/components/storefront/`                    | React storefront shell, product cards, cart state, checkout and UI controls                            |
| `src/components/admin/`                         | JSX admin shell/navigation and React orders/products/inventory/customers/categories screens            |
| `src/admin/main.ts`, `src/admin/views.ts`       | Existing admin state, data loading, event delegation, editors and remaining imperative feature screens |
| `src/components/admin/AdminCategoriesPanel.tsx` | React category management UI; Supabase CRUD remains protected by database RLS                          |
| `src/lib/`                                      | Server catalogue access, SEO/media helpers, Supabase server/client utilities                           |
| `src/shared/`                                   | Shared types, catalogue helpers, formats, slug and browser Supabase helpers                            |
| `src/styles/`, `src/app/globals.css`            | Existing ENRM styles plus admin/login/Next route styles                                                |
| `public/catalogue.json`                         | Local 210-variant fallback catalogue; not a substitute for verified production Supabase configuration  |
| `public/assets/`                                | Brand marks, product images, fonts and video                                                           |
| `supabase/migrations/`                          | Versioned schema, RLS, RPC and storage policies                                                        |
| `scripts/`                                      | Build-output guard and Supabase seed generation                                                        |
| `tests/`                                        | Vitest/jsdom unit and user workflow coverage                                                           |

`src/admin` remains the clearest architectural seam: it currently mixes state/data orchestration and rendering in a single imperative module. Orders/products/inventory/customers React panels consume a browser event snapshot and delegate mutations back to that module; the category panel uses the Supabase browser client directly under RLS. This is an incremental bridge, not a fully React-native admin architecture.

## Admin migration status

| Area                | Rendering/data status                                                                                                                                                  |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Authentication gate | Server-side `/admin` layout verifies Supabase claims and current `profiles.role`; middleware refreshes Supabase cookies and applies CSP to admin/login/recovery routes |
| Shell/navigation    | React JSX                                                                                                                                                              |
| Orders              | React list; secure detail/status mutation remains in existing admin workflow and order RPC                                                                             |
| Products/inventory  | React tables; editors, uploads and writes remain in existing admin workflow/RPCs                                                                                       |
| Customers           | React table; connected customer rows are derived from orders, not a customer-account/CRM feature                                                                       |
| Categories          | React UI; authenticated Supabase reads/writes rely on database RLS                                                                                                     |
| Overview/analytics  | Still imperative; connected data uses dashboard queries/RPCs                                                                                                           |
| Promotions/settings | Still imperative; connected admin explicitly sees these features as unconfigured because there is no persistent backend model                                          |

The admin UI is therefore not “finished” as a complete React migration. Its intended order workflow exists, but overview/analytics, promotions/settings, editors, error/loading states, and the connected role matrix need a deliberate feature-by-feature migration. Do not imply promotions or shared settings persist in production.

## Security boundary

- The `/admin` server layout fails closed unless verified Supabase claims and a current admin profile role are present. Middleware refreshes cookies for `/admin`, `/login`, and `/reset-password` and sets CSP-related response headers.
- The browser receives only the Supabase URL and anon key. No service-role credential belongs in a browser bundle.
- PostgreSQL RLS, table privileges, storage policies, and role-checking RPCs remain the true authorization boundary for direct browser Supabase calls. A hidden nav item or React state is not authorization.
- `place_enrm_order` is intentionally callable by anonymous customers to create requests; it validates current products/prices/stock in the database. `update_enrm_order` and product/stock mutations require admin authorization.
- No production Supabase, DNS, Cloudflare dashboard, or deployment state was inspected or changed for this review. Local verification does not prove hosted settings match migrations.

## Verification recorded for the current work

The existing local checks cover format, strict TypeScript, Vitest/jsdom workflows, Next/OpenNext build, Worker package contents, and a Wrangler dry-run. Local HTTP smoke checks cover public routes, legacy redirects, product canonicalization/not-found behavior, and unauthenticated admin redirection. They do not validate the current hosted Supabase project or Cloudflare deployment. See `MIGRATION_REPORT.md` for dated evidence and exact command results.

## Remaining work before calling the whole project production-ready

1. Finish React migration of overview/analytics, promotions/settings decisions, and product/order editors. Keep the server auth gate and database RPC/RLS contracts.
2. Add/maintain route-level regression coverage for slug canonicalization, legacy redirect parameters, admin login redirect reasons, user role denial, and hash navigation. Exercise both connected-admin and no-Supabase demo modes.
3. Use an already available isolated/local Supabase instance for repeatable authorization and workflow checks. Do not create another hosted project or incur compute charges without explicit instruction.
4. Fix/verify any remaining cross-feature defects such as uploaded Supabase Storage absolute URLs being rendered consistently across detail, cart, metadata, and admin preview.
5. Verify staging only if an existing non-production environment is confirmed. A production deployment is a separate, explicit release action.
