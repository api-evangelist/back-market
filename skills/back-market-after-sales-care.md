---
name: Run Back Market after-sales (Care) cases
description: Work a seller's Care folders on Back Market's after-sales platform — read cases, declare problems, message the customer, issue refunds, and record item transfers back to the buyer.
api: openapi/back-market-openapi-original.yml
generated: '2026-08-02'
method: generated
source: openapi/back-market-openapi-original.yml + https://api.backmarket.dev/
operations:
  - getCareFolderList
  - getCareFolderDetails
  - postProblem
  - postMessage
  - postRefundCreate
  - postItemTransfer
---

# Run Back Market after-sales (Care) cases

Back Market's after-sales platform (`/ws/sav`) organises every post-purchase issue into a
**Care folder** attached to an orderline. This skill works that queue.

## Before you start

- Standard headers apply. The Care surface is the only one with **published per-endpoint
  rate limits** — respect them (see `rate-limits/back-market-rate-limits.yml`):
  - `getCareFolderList` — 520/min, 4,000/day
  - `getCareFolderDetails` — 600/min, 40,000/day
  - `postProblem` — 750/min, 1,000/day
  - `postMessage` — 560/min, 40,000/day
  - `postRefundCreate` — 500/day
  - `postItemTransfer` — 292/min, 500/day
- `postRefundCreate` moves money and `postItemTransfer` ships hardware. Neither is
  idempotent and neither is reversible through this API — confirm state with
  `getCareFolderDetails` before and after, and put a human in the loop for refunds.

## Steps

1. **List the queue.** `getCareFolderList` (`GET /ws/sav`) with `state`, `orderline`,
   `last_modification_date`, `last_message_date` filters. Paginate with `page`, or walk
   forward with `last_id`.
2. **Open a case.** `getCareFolderDetails` (`GET /ws/sav/{careFolderId}`) returns the full
   folder: `client`, `seller`, `claim`, `issue[]`, `message[]`, `orderline`, `order`,
   `snapshot`, `attachment[]` and any `returnLabel`.
3. **Declare a problem.** `postProblem` (`POST /ws/sav/{careFolderId}/problem`) records what
   is wrong. Attachments are **mandatory for some problem types** — a `422` with that
   message means add them; `413` means the file is too large or there are too many
   attachments.
4. **Talk to the customer.** `postMessage` (`POST /ws/sav/{careFolderId}/msg`) posts on the
   after-sales thread. `201` on success.
5. **Refund.** `postRefundCreate` (`POST /ws/sav/refund`) creates a refund on an orderline.
   `201` on success; `404` means the orderline does not exist. Do not retry on an ambiguous
   response — re-read the folder first.
6. **Send the item back.** `postItemTransfer`
   (`POST /ws/sav/{careFolderId}/item-transfer`) declares a transfer of the device back to
   the customer. A `400` with "An item transfer with this tracking number already exists"
   is the platform's only de-duplication signal — treat it as success, not as an error to
   retry. Care folders with an id above 100,000,000 cannot accept item transfers (`422`).

## Errors

The Care surface mostly declares statuses without a response schema: `401` Guest user not
allowed, `403` Authenticated user not allowed, `404` Care Folder does not exist, `413` file
too large, `422` validation, `500` shipment registration failed. Where a body is returned it
follows the `ErrorResponseV1` shape with a `requestId` — quote it to
`partner-support@backmarket.com` or the Seller Support Center.
