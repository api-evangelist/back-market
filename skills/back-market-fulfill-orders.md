---
name: Fulfill Back Market orders end to end
description: Poll new marketplace orders, accept and ship them line by line, attach the customer invoice, and track deliveries and returns through Backship.
api: openapi/back-market-openapi-original.yml
generated: '2026-08-02'
method: generated
source: openapi/back-market-openapi-original.yml + https://api.backmarket.dev/
operations:
  - get-ws-list-order
  - get-ws-specific-order
  - update-ws-specific-order
  - update-ws-specific-orderline
  - post-ws-specific-order-invoice
  - GetDeliveries
  - GetDelivery
  - GetReturns
  - GetReturn
---

# Fulfill Back Market orders end to end

Use this when an agent operates a seller's order pipeline on Back Market: discover new
orders, move them through the state machine, ship, invoice, and watch returns.

## Before you start

- Same mandatory headers as every Back Market call: `Authorization: Basic <token>`,
  `Accept-Language: <country code>`, the descriptive `User-Agent`, and JSON content types.
- **There are no webhooks.** Order discovery is polling — there is no event surface to
  subscribe to.
- **There is no idempotency key.** A repeated state transition is a real second write;
  read the order back before retrying.

## Steps

1. **Poll for work.** `get-ws-list-order` (`GET /ws/orders`) filtered by
   `date_modification` (or `date_creation`), `state`, and `country_code`. Persist the last
   `date_modification` you processed and use it as the low-water mark for the next poll.
2. **Read one order.** `get-ws-specific-order` (`GET /ws/orders/{order_id}`) returns the
   `Order` with its `OrderLine[]`, shipping `Address`, `VatType` and state.
3. **Advance the order.** `update-ws-specific-order` (`POST /ws/orders/{order_id}`) applies
   the `UpdateOrder` payload for order-level transitions.
4. **Advance a line.** `update-ws-specific-orderline`
   (`PATCH /ws/orderlines/{orderline_id}`) is the unit that actually ships: set the new
   `OrderLineState`, tracking information and shipper. `422` here is a validation failure —
   read the `ErrorResponseV1` / `OrderIdValidationError` body's `data.fields` for which
   field was rejected.
5. **Attach the customer invoice.** `post-ws-specific-order-invoice`
   (`POST /ws/orders/{order_id}/invoice`) uploads the invoice document for the buyer.
6. **Track the shipment.** If the seller uses Back Market-managed shipping, `GetDeliveries`
   (`GET /ws/shipping/v1/deliveries`) and `GetDelivery` (`GET /ws/shipping/v1/deliveries/{id}`)
   expose delivery records; filter by `order_id`, `start_date`/`end_date`,
   `pickup_start_date`/`pickup_end_date`, `order_state`, `hub_scanned`. Paginate with `page`.
7. **Watch returns.** `GetReturns` (`GET /ws/shipping/v1/returns`) and `GetReturn`
   (`GET /ws/shipping/v1/returns/{id}`) carry the return flow, including `ReturnReason` and
   `PickupInfo`. A return usually becomes a Care case — hand off to the after-sales skill.

## Errors

- `400` bad request / invalid payload, `403` forbidden (not a merchant, or WAF),
  `404` order / orderline / delivery not found, `422` validation error.
- Backship operations answer `422` (Unprocessable Entity) and `404` with an RFC 7807-flavored
  `Problem` body — `type` is a readable path such as `/errors/authorization-failed`, not a URI,
  and the media type is `application/json`.
- Every envelope carries `requestId`; quote it to support.

See `errors/back-market-problem-types.yml` for the full response inventory.
