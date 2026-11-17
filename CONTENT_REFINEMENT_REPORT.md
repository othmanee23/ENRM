# ENRM.ma content refinement report

**Review date:** 17 November 2026  
**Scope:** public storefront source and live pages observed on 16 November 2026. No production write or deployment was performed.

## Editorial inventory

| Page/component       | Existing content                                                          | Issue                                                                                                                 | Applied improvement                                                                                                                     |
| -------------------- | ------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Home                 | Brand-led headline, catalogue, featured products                          | The first screen did not explain the request workflow; featured cards displayed unvalidated numeric prices            | Kept the visual headline and added a factual explanation, catalogue/advice CTAs, and price/availability confirmation copy               |
| Catalogue            | 210 catalogue variants; filters; price sort; “prix de démonstration” note | Numeric values were not validated for sale, while sort implied meaningful customer prices                             | Removed price sort and replaced public price display with “Prix à confirmer”; filters and product data are unchanged                    |
| Product detail       | Product designation, specification fields, request CTA and numeric price  | A sample live page displayed a price despite “indicatif” qualification; generic imagery could look like the exact SKU | Suppressed numeric price, described identity from catalogue fields, neutralized generic/missing imagery, and clarified request behavior |
| Cart                 | Local cart with prices and subtotal                                       | Exposed the same unvalidated values                                                                                   | Removed displayed line prices/subtotal; retained item/quantity controls and order request flow                                          |
| Order request        | Contact form and order-request RPC                                        | Confirmation could be read as a priced/confirmed order                                                                | Confirmation now says ENRM will contact the customer to confirm details; no RPC or request payload change                               |
| Advice               | Vehicle fields handled locally                                            | “Prepare my advice” could imply transmission to an adviser                                                            | Label and helper/confirmation now state that the information remains local and compatibility needs manufacturer verification            |
| Contact              | No public phone, email, address, hours or WhatsApp                        | Contact page implied more direct contact than it offered                                                              | Describes the actual catalogue request route and clearly lists missing public contact channels                                          |
| About                | Described storefront as a demonstration                                   | Contradicted working catalogue and order-request workflow                                                             | Describes the catalogue and flags missing manufacturer references/photos and the need to verify fitment                                 |
| Delivery             | No published rates, areas or delivery times                               | Potential ambiguity around whether details are guaranteed                                                             | Explicitly says these terms must be confirmed by ENRM; no delivery promise introduced                                                   |
| Returns / conditions | Return, refund, warranty and legal terms absent                           | Absence was framed as a demo caveat                                                                                   | States these policies and company legal details remain unpublished and require ENRM validation                                          |
| Privacy              | Checkout data flow partly inaccurately described                          | Claimed client-sent prices although server calculates the subtotal                                                    | Corrected fields and processing description; marked controller, retention and rights contact as incomplete                              |
| Shared header/footer | “Indicative prices” and conditions caveat                                 | Could lend credibility to unverified amounts                                                                          | States price, availability and delivery are confirmed by ENRM                                                                           |

## Representative before/after

| Page/component   | Before                                           | After                                                                                                                                                                        | Reason                                                                               | Status  |
| ---------------- | ------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ | ------- |
| Home hero        | “Le mouvement. À l’état pur.” then catalogue CTA | Preserved headline; added “Parcourez les références par marque, viscosité et contenance. ENRM vous confirmera le prix et la disponibilité après réception de votre demande.” | Explain what the customer can do without making compatibility or fulfilment promises | Applied |
| Product cards    | Numeric MAD value and add-to-cart action         | “Prix à confirmer” and add-to-request action                                                                                                                                 | Avoid publishing unvalidated amounts                                                 | Applied |
| Cart/checkout    | Indicative totals                                | “Prix à confirmer”; confirmation says ENRM will confirm details                                                                                                              | Keep the request flow clear and honest                                               | Applied |
| Image fallback   | “Visuel exact à venir” or generic illustration   | “Photo non disponible” / “Visuel à valider”; generic product images hidden                                                                                                   | Avoid suggesting generic packaging depicts the exact SKU                             | Applied |
| Advice form      | “Préparer mon conseil”; demonstration disclaimer | “Préparer mon récapitulatif”; explicit local-only statement                                                                                                                  | Match actual form behavior                                                           | Applied |
| Contact          | No listed channels and claim no request is sent  | Actual catalogue request instructions; missing channels disclosed                                                                                                            | Align wording with functional checkout and missing contact data                      | Applied |
| Delivery/returns | Demonstration language                           | Exact unknown commercial/legal terms identified as pending ENRM                                                                                                              | Avoid invented commitments                                                           | Applied |

## Product content and claims

The catalogue contains 210 records. Existing `designation` values were retained; no generated description was written to the database or displayed as new manufacturer copy. Product titles and metadata use only existing brand, sub-reference, viscosity and package fields. Structured data contains Product identity, SKU, brand, and a verified image only; no price, offer, availability, review or rating was added.

All numeric catalogue prices remain in source/backend data because the order RPC still uses its catalog calculation. The customer-facing site no longer displays them. ENRM must validate each price before numeric publication. This is a deliberate code-only precaution; no price, stock, category, order or database record was changed.

The advice copy does not claim fitment. The privacy wording describes the checked client request fields and server-side recalculation but still needs legal owner/retention details from ENRM.

## Files changed

- `src/app/layout.tsx`
- `src/app/(storefront)/page.tsx`
- `src/app/(storefront)/catalogue/page.tsx`
- `src/app/(storefront)/produits/[slug]/page.tsx`
- `src/app/(storefront)/a-propos/page.tsx`
- `src/app/(storefront)/contact/page.tsx`
- `src/app/(storefront)/conseil/page.tsx`
- `src/app/(storefront)/livraison/page.tsx`
- `src/app/(storefront)/retours/page.tsx`
- `src/app/(storefront)/confidentialite/page.tsx`
- `src/components/storefront/ProductCard.tsx`
- `src/components/storefront/StorefrontChrome.tsx`
- `src/components/storefront/StorefrontControls.tsx`
- `src/components/storefront/CartClient.tsx`
- `src/components/storefront/CheckoutClient.tsx`
- `src/components/storefront/AdviceMiniForm.tsx`
- `src/styles/storefront/home.css`
- `tests/seo.test.ts`
- `tests/storefront.test.tsx`
- `PRODUCT_CONTENT_REVIEW.csv` (210 product review rows; proposal only)

## ENRM approval needed

1. Validate the commercial price of every SKU before restoring public numeric pricing.
2. Supply manufacturer SKU/article references, technical sheets and documented approvals for records missing them.
3. Confirm product photos against exact manufacturer reference and package size; replace generic art only with verified assets.
4. Supply public contact phone/email/address/hours and a functioning customer advice contact route.
5. Approve company legal identity, privacy controller and retention period, terms of sale, payment terms, return/refund/warranty policy, delivery zones/rates/timing.
6. Confirm stock/availability wording and whether catalogue-listed items may remain requestable when stock status is uncertain.
