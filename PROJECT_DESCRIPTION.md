# ENRM — Project Description

## Purpose

ENRM is a French-language product catalogue and order-request platform for an automotive oils and related-products business in Morocco. The public site helps customers identify and request specific product variants. The business workflow is manual follow-up: customers provide contact and delivery details, then an administrator contacts them and tracks the request. The site does not collect payment or calculate final delivery charges.

## Technology stack

| Layer          | Technology                                         | Responsibility                                                                                                                  |
| -------------- | -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Web framework  | Next.js App Router                                 | Route handling, server-rendered pages, metadata, sitemap, robots, and Cloudflare-compatible output                              |
| UI             | React and TypeScript (strict)                      | Shared layouts and interactive cart and checkout; some existing screens still run through a temporary DOM compatibility runtime |
| Styling        | Tailwind CSS 4 plus retained ENRM stylesheets      | Utility styling and preservation of the established visual identity during migration                                            |
| Database       | Supabase PostgreSQL                                | Categories, products, inventory, order requests, order items, and status history                                                |
| Authentication | Supabase Auth                                      | Administrator sign-in and session handling                                                                                      |
| Authorization  | Supabase Row Level Security and database functions | Enforce public reads, administrator writes, inventory privacy, and order-request permissions                                    |
| Media          | Supabase Storage plus checked-in `public/assets/`  | Product media and brand assets                                                                                                  |
| Hosting        | Cloudflare Workers via OpenNext                    | Run the Next.js server application at the Cloudflare edge                                                                       |
| Verification   | TypeScript, Vitest, and jsdom                      | Type and workflow regression checks                                                                                             |

No separate API server, Prisma layer, alternate authentication service, or payment gateway is used.

## Public customer experience

The application serves the homepage, catalogue, product details, advice, contact, about, delivery, returns, privacy, and credits pages. The Next.js routes use server-rendered HTML for the homepage, catalogue product cards, and product detail content. Product titles, canonical URLs, Open Graph metadata, product JSON-LD, and breadcrumb JSON-LD are generated from the selected catalogue record. Unpublished or unknown IDs are not rendered as public products.

The catalogue contains 210 distinct existing variants. A variant is identified by its original product ID and preserves its formulation, packaging, price, and image references. Product URLs include a normalized descriptive label and the immutable ID suffix to avoid collisions. Existing `.html` product links are redirected or resolved to the new routes.

Visitors can search and filter by category, brand, range, viscosity, and package size, sort results, choose exact packaging variants, and use a browser-persisted cart. The order-request form asks for a name, phone number, city, delivery address, and privacy acknowledgment. The displayed subtotal is indicative. Checkout sends only product IDs, quantities, customer details, and a unique request ID to the existing Supabase function. It does not create a payment or finalize availability, delivery cost, or final price.

## Administrator experience

`/admin` is dynamically gated on the server: the Supabase JWT is verified with `getClaims()`, then the current `profiles.role` is checked before the admin shell is returned. The login page verifies the role after password sign-in and signs out non-admin accounts. A recovery form emails a one-time link and the reset page lets the account owner set a new password. Supabase cookies are refreshed on admin/login/reset requests, and the admin has a sign-out control. Database policies and functions independently enforce the role and permissions. The interface supports product and image management, category management, inventory editing, and real order request review/status updates when connected to Supabase.

Orders represent customer requests and include the contact details, delivery address, order item snapshots, indicative total, status, tracking information, internal notes, and status history. ENRM manually contacts customers and advances request status. Cancellation follows the database workflow and stock reservation rules. No user-side payment state is part of the current order workflow.

Customers and analytics derive from real order requests when connected, grouping repeat orders by normalized phone. Order totals are indicative request subtotals; there is no payment processing. Promotions and shared store settings have no persistent backend schema and are clearly marked unconfigured for connected admins.

## Scalable category model

Categories are database rows with stable IDs, unique slugs, display order, active state, and an optional parent ID. Products refer to categories by ID. Public navigation and filtering load active category records rather than using a fixed list in code. Administrators can add categories through the existing category-management interface, which allows new product families to be introduced without a frontend code change. The current management UI focuses on top-level categories; full parent/child editing is not exposed.

## Supabase data and security

The schema history lives in `supabase/migrations/`. It includes profiles and admin roles, categories, product catalogue records, private inventory, customer order requests, line items, order status history, and the `product-media` storage bucket. Public visitors use the Supabase anon key and can read only active categories and published products under RLS. The browser never receives a service-role key.

`place_enrm_order` is the existing transactional order boundary. It rechecks currently published products and server-side prices, validates stock and quantity, records order/item snapshots, and reserves stock according to the established database workflow. Requests are idempotent using a request UUID. Administrator mutations use existing authenticated database privileges and the order update RPC. The frontend migration has not changed hosted schema or data.

## Hosting and configuration

The application is built with the OpenNext Cloudflare adapter. `open-next.config.ts` selects the Next webpack build command to prevent the adapter from recursively invoking the package build script. `wrangler.jsonc` points to `.open-next/worker.js`, enables `nodejs_compat`, and serves `.open-next/assets` through the `ASSETS` binding.

Required public build variables are:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SITE_URL` (for example, `https://enrm.ma`)

These are browser-visible values by design; never configure a Supabase service-role key in the frontend. Cloudflare’s current build environment still needs those variable names set before a future production build. No production deployment or dashboard change is included in this migration.

## Migration status and limits

The repository is on `fix/nextjs-migration`. App Router routing, server-side rendering for the main commerce content, category/product queries, SEO metadata, structured URLs, no-payment cart/checkout pages, and an OpenNext Worker artifact are implemented. The generated compatibility layer still embeds the original checked-in page markup, while `src/storefront/main.ts` and much of `src/admin/main.ts` remain imperative DOM applications loaded as browser modules. Therefore the build is a working migration stage, not yet a complete React component rewrite. The old Vite page entry files and test harness are retained during the transition.

No hosted Supabase schema migration was applied, no production data was rewritten, no service-role secret was added, and no production Worker was deployed. Before cutover, finish replacing the compatibility HTML and DOM runtime with React components, validate the experimental OpenNext Proxy session-refresh behavior in a staging Worker, test authentication and RLS with admin/non-admin accounts, validate all public routes visually, configure the new Cloudflare build variable names, and test against a non-production Supabase project.
