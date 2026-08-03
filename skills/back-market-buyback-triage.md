---
name: Triage Back Market BuyBack trade-in orders
description: Work the refurbisher side of Back Market's trade-in flow — list incoming BuyBack orders, reply to customers, validate, counter-offer or suspend, and keep BuyBack listings priced.
api: openapi/back-market-openapi-original.yml
generated: '2026-08-02'
method: generated
source: openapi/back-market-openapi-original.yml + https://api.backmarket.dev/
operations:
  - get-ws-buyback-v1-orders
  - get-ws-buyback-v1-orders-pending-reply
  - get-ws-buyback-v1-order
  - get-ws-buyback-v1-orders-messages
  - post-ws-buyback-v1-orders-messages
  - put-ws-buyback-v1-orders-validate
  - put-ws-buyback-v1-orders-suspend
  - get-ws-buyback-v1-orders-suspend-reasons
  - get-ws-counter-offer-reason
  - put-ws-refurbisher-counter-offer
  - get-ws-buyback-v1-listings
  - get-ws-buyback-v1-listing
  - put-ws-buyback-v1-listing
---

# Triage Back Market BuyBack trade-in orders

BuyBack is Back Market's trade-in program: a consumer sends a device to a refurbisher, who
inspects it and either validates the quoted price, makes a counter-offer, or suspends the
order. Use this skill to run that queue.

## Before you start

- Standard headers apply (`Authorization: Basic <token>`, `Accept-Language`, descriptive
  `User-Agent`, JSON content types).
- BuyBack is the one surface that mixes API versions: orders, messages and listings live
  under `/ws/buyback/v1/`, counter-offers under `/ws/buyback/v2/`.
- BuyBack listing reads paginate with `cursor` + `pageSize` (max 100), unlike the rest of
  the API — do not assume `page`.
- Every write here is customer-visible and financially consequential. There is **no
  idempotency key**: read the order state back before retrying anything.

## Steps

1. **Pull the queue.** `get-ws-buyback-v1-orders` (`GET /ws/buyback/v1/orders`) for all
   orders, or `get-ws-buyback-v1-orders-pending-reply`
   (`GET /ws/buyback/v1/orders/pending-reply`) for the ones actually waiting on you — start
   there.
2. **Open one order.** `get-ws-buyback-v1-order`
   (`GET /ws/buyback/v1/orders/{buybackOrderId}`) returns the `buyback-order` with its
   state, grade, price and any `buybackKycDocuments`.
3. **Read and answer the customer.** `get-ws-buyback-v1-orders-messages` then
   `post-ws-buyback-v1-orders-messages` (`POST .../messages`) — a `201` confirms the message
   landed. `422` means the payload failed validation (`ValidationErrorResponseV3`, with a
   per-field `errors[]`).
4. **Decide.**
   - Accept as quoted: `put-ws-buyback-v1-orders-validate`
     (`PUT /ws/buyback/v1/orders/{buybackOrderId}/validate`).
   - Offer less: first `get-ws-counter-offer-reason`
     (`GET /ws/buyback/v1/orders/{buybackOrderId}/counter-offers/reasons`) to get the valid
     `buyback-counter-offer-reasons`, then `put-ws-refurbisher-counter-offer`
     (`PUT /ws/buyback/v2/orders/{buybackOrderId}/counter-offers`). It answers `204` on
     success and is rate limited — a `429` means back off, not retry immediately.
   - Block the order: `get-ws-buyback-v1-orders-suspend-reasons` for the allowed reasons,
     then `put-ws-buyback-v1-orders-suspend` (`PUT .../suspend`).
5. **Keep the buy prices current.** `get-ws-buyback-v1-listings`
   (`GET /ws/buyback/v1/listings`, cursor-paginated) and `get-ws-buyback-v1-listing`
   (`GET /ws/buyback/v1/listings/{buybackListingId}`) to read, `put-ws-buyback-v1-listing`
   (`PUT /ws/buyback/v1/listings/{buybackListingId}`) to update. The update returns `202` —
   it is accepted asynchronously, so re-read before assuming it applied.

## Errors

BuyBack uses the `ErrorResponseV3` envelope (`error`, `status`, `title`, `type`,
`requestId`) and `ValidationErrorResponseV3` for `422`. Expect `401` Unauthorized,
`403` Permission denied, `404` Not Found, `422` Unprocessable Entity, `429` Too Many
Requests and a catch-all `5XX` Internal Error. `type` is a readable path
(e.g. `/errors/validation-error`), not a URI.

The `GET /ws/buyback/v1/competitors/{listingId}` endpoint is **deprecated** in favor of
`/ws/backbox/v1/competitors/{listingId}` — see `lifecycle/back-market-lifecycle.yml`.
