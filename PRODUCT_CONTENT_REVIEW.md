# ENRM product content review

**Date:** 17 November 2026. Review covers the checked-in catalogue snapshot, not a production database export. No catalogue records were edited.

## Catalogue-wide results

| Check                                                          | Result | Handling                                                                                |
| -------------------------------------------------------------- | -----: | --------------------------------------------------------------------------------------- |
| Catalogue variants                                             |    210 | Every record is included in `PRODUCT_CONTENT_REVIEW.csv`                                |
| Missing manufacturer article/reference (`references_articles`) |    186 | Requires manufacturer or ENRM confirmation                                              |
| Missing image reference (`reference_image`)                    |    169 | Requires exact SKU/package mapping                                                      |
| Recto marked “À obtenir”                                       |     72 | No verified front product image                                                         |
| Recto marked “Illustration générique”                          |      6 | Generic image suppressed on public product card/detail/cart                             |
| Numeric prices in snapshot                                     |    210 | Kept in data/backend; hidden from public price presentation pending commercial approval |

## Review file

The accompanying CSV includes every SKU, existing designation, confirmed identity fields, a conservative draft description, reference/image/source fields, price-to-validate marker, and manual approval status. Draft wording only repeats the catalogue identity and advises checking manufacturer/vehicle documentation. It does not assert approvals, standards, compatibility, performance benefits, or price validity. It is a review aid and must not be imported as published copy without human validation.

Sample row, `ENRM-HM-001`:

- **Catalogue identity:** Castrol / EDGE / 0W-20 / 1 L; designation “Castrol EDGE 0W-20 C5”.
- **Draft:** “Référence Castrol EDGE EDGE 0W-20 1 L. Vérifiez les spécifications du fabricant et les préconisations du constructeur avant de choisir ce produit. Prix et disponibilité à confirmer par ENRM.”
- **Missing:** manufacturer article number, image reference, front and reverse photos; the source recorded is a broad category page, not item-specific documentation.
- **Validation:** manufacturer identity/specification, exact formulation and all commercial details require confirmation.

The sample shows why the CSV draft is intentionally conservative and not yet publish-ready. Brand/range text may need editorial normalization; only a person with product documentation should resolve formulation names and specs.

## Public handling applied

- Product page/card/cart no longer display catalogue numeric prices. The backend order request still runs as before and the server still recalculates its total; there was no database or RPC change.
- Catalogue price sorting was removed because the public values are not approved for customer-facing comparison.
- “Illustration générique” imagery is not rendered as if it were the selected SKU. Missing-image states use neutral text.
- Existing designations and product records remain intact. No generated description, technical standard, compatibility, availability or approval was written to Supabase or the static catalogue.

## Required product review by ENRM

For each SKU, check manufacturer article number, exact formulation, SAE grade, applicable API/ACEA/OEM approvals against current manufacturer documentation, package size, front/reverse image, source link, numeric price and inventory state. Record evidence and review date. Keep unverified fields blank rather than inferring them from a similar product or another package size.
