---
name: Price listings against the Back Market BackBox
description: Pull BackBox performance data and competitor pricing for a seller's listings and decide the smallest price move that wins the buy box.
api: openapi/back-market-openapi-original.yml
generated: '2026-08-02'
method: generated
source: openapi/back-market-openapi-original.yml + https://api.backmarket.dev/
operations:
  - GetBackboxData
paths:
  - GET /ws/listings_bi
  - GET /ws/backbox/v1/competitors/{listingId}
  - GET /ws/buyback/v1/competitors/{listingId}
note: >-
  GET /ws/backbox/v1/competitors/{listingId} declares no operationId in the published spec.
  GET /ws/buyback/v1/competitors/{listingId} is deprecated in favor of the backbox path.
---

# Price listings against the Back Market BackBox

The "BackBox" is Back Market's buy box. This skill reads the competitive signal Back Market
exposes to sellers and turns it into a price decision.

## Before you start

- Standard headers apply, including the `Accept-Language` country code — competitive
  position is **per marketplace country**, so run this once per market.
- `GetBackboxData` is rate limited (`429` on breach) and the catalog-class edge limit
  (~20 requests / 10 seconds) applies to competitive reads.
- Nothing here writes. Price changes go back through the listings skill
  (`POST /ws/listings/{listingId}`) and are subject to the 2,000 SKU-lines-per-hour data
  limit.

## Steps

1. **Pull BackBox data per listing.** `GetBackboxData` (`GET /ws/listings_bi`) returns the
   `Backbox` record for the seller's listings — the performance view Back Market publishes
   for buy-box position.
2. **Read the competitor set.** `GET /ws/backbox/v1/competitors/{listingId}` returns
   `Competitor[]` for a single listing. Use this path, not the deprecated
   `GET /ws/buyback/v1/competitors/{listingId}`.
3. **Decide the smallest effective move.** Compare your `Price` / `MonetaryAmount` and
   `AestheticGradeValue` against the competitor set. Back Market publishes a worked example
   of this reasoning as a Colab notebook: "Winning the BackBox based on small price efforts"
   (linked from the API Guidelines).
4. **Apply the change.** Write the new country-specific price with
   `POST /ws/listings/{listingId}` under the matching `Accept-Language`, then confirm with
   `GET /ws/listings/{listingId}`.
5. **Re-measure.** Re-run step 1 after the marketplace has re-evaluated; do not chain price
   changes faster than you can observe their effect.

## Errors

`403` Forbidden (not a merchant, or Cloudflare WAF / bot challenge), `404` listing or
webservices unavailable, `422` Unprocessable Entity, `429` rate limited with the
`ErrorResponseV1` envelope. Every error body carries `requestId`.
