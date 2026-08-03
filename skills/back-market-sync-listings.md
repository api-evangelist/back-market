---
name: Sync a refurbished catalog to Back Market listings
description: Publish and keep in sync products and offers (listings) on the Back Market marketplace, including the asynchronous batch write and its task handle.
api: openapi/back-market-openapi-original.yml
generated: '2026-08-02'
method: generated
source: openapi/back-market-openapi-original.yml + https://api.backmarket.dev/
operations: [get-bm-catalog-category]
paths:
  - GET /ws/category/tree
  - GET /ws/category/tree/{categoryId}
  - GET /ws/listings
  - POST /ws/listings
  - GET /ws/listings/{listingId}
  - POST /ws/listings/{listingId}
  - GET /ws/listings/detail
  - GET /ws/tasks/{taskId}
note: >-
  Only get-bm-catalog-category declares an operationId in the published spec; the listing
  and task operations are addressed by method + path.
---

# Sync a refurbished catalog to Back Market listings

Use this when an agent must get a seller's inventory of refurbished devices onto Back
Market and keep price and quantity current.

## Before you start

- Pick the regional base URL: `https://www.backmarket.fr` (EU), `https://www.backmarket.com`
  (NA), `https://www.backmarket.co.jp` (AP). Use the matching `preprod.` host to rehearse.
- Send every request with:
  - `Authorization: Basic <Back Office token>`
  - `Accept-Language: <country code>` — this selects **which marketplace country** the call
    reads or writes (e.g. `fr-fr`, `de-de`, `en-us`, `ja-jp`)
  - `User-Agent: BM-{CompanyName}-{IntegrationName};company@companydomain.com` — mandatory,
    requests without it may be refused
  - `Content-type: application/json`, `Accept: application/json`
- There is **no idempotency key**. Never blind-retry a `POST /ws/listings`; poll the task
  instead (step 4).

## Steps

1. **Locate the category.** Call `get-bm-catalog-category` (`GET /ws/category/tree`) to pull
   the taxonomy, or `GET /ws/category/tree/{categoryId}` for one branch. A product must be
   attached to a leaf category before it can be listed.
2. **Read what is already live.** `GET /ws/listings` with `publication_state`,
   `min_quantity`, `max_quantity` filters, or `GET /ws/listings/detail` for the richer
   payload. Note that `listing_id` and the integer product id are **deprecated** — key
   everything off the UUID `id` / `product_id`.
3. **Write products and offers.** `POST /ws/listings` creates or updates in batch. Respect
   the published data limit: **no more than 2,000 SKU lines per hour**. Exceeding it returns
   `429` with the `ErrorResponseV1` envelope and Back Market may refuse the task outright.
4. **Poll the task.** The batch write returns a task id — call `GET /ws/tasks/{taskId}`
   until it resolves. This is the only de-duplication handle in the API: poll, do not
   resubmit. A `404` here means the task does not exist or does not belong to your account.
5. **Adjust a single offer.** `POST /ws/listings/{listingId}` for a targeted price, quantity
   or comment update; `GET /ws/listings/{listingId}` to confirm.
6. **Remember the country split.** `quantity` and other product-level fields apply to every
   country at once; `comment`, `price` and `warranty_delay` are per country — repeat the
   write with a different `Accept-Language` for each market you sell in.

## Errors and throttling

- `400` — invalid input or missing required field (`ErrorResponseV1` / inline schema)
- `401` — unauthenticated; `403` — authenticated but not a merchant, or the ingestion
  channel is disabled for this merchant
- `403` with `{"errors":[{"code":"bot-need-challenge", ...}]}` — Cloudflare bot management;
  capture the `cf-ray` response header and escalate to your seller contact
- `404` — listing not found or not owned by this merchant
- `429` — rate limited (edge limit ~200 requests / 10s, ~20 / 10s on catalog endpoints)
- Every error body carries `requestId`; quote it to Back Market support.

See `conventions/back-market-conventions.yml`, `errors/back-market-problem-types.yml` and
`rate-limits/back-market-rate-limits.yml` for the full rules.
