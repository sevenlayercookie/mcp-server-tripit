# TripIt v2 `RestaurantObject`

## Scope and evidence

This page records only what the captured [`www.tripit.com.har`](./www.tripit.com.har)
establishes for the Restaurant plan family. The HAR contains no RestaurantObject
payload and no deserialized RestaurantObject instance. It therefore cannot support
a wire-field table, nested schema, cardinality claim, or representative JSON
example. No fields or example are invented here.

The relevant evidence is the `TripItemTypes-CeicT-Cc.js` registry and route bundle,
plus generic reservation/API code in `index-C6qCNcMY.js`. The active browser page was
car rental; this is a single point-in-time frontend capture, not an official API
description.

Evidence labels:

- **Payload-observed:** occurs in the captured response body. None is available for
  RestaurantObject.
- **Frontend-observed:** appears in a JavaScript response captured by the HAR.
- **Inferred:** interpretation only; it is not a server contract.

## Registry entry

The frontend registry declares the following mapping:

| Type code | Response property | Frontend slug | Payload in this HAR |
| --- | --- | --- | --- |
| `R` | `RestaurantObject` | `restaurant` | Not present |

The successful trip-read response has root keys `AirObject`, `CarObject`,
`LodgingObject`, `Profile`, `Trip`, `timestamp`, and `num_bytes`; it does not have
`RestaurantObject`.

## Exact SPA route family

`TripItemTypes-CeicT-Cc.js` declares these **browser SPA routes**. They are route
patterns, not proof of corresponding HTTP endpoints:

| SPA path | Route name |
| --- | --- |
| `/trips/:tripUuid/restaurant/create` | `segment_restaurant_create` |
| `/trips/:tripUuid/restaurant/:segmentUuid` | `segment_restaurant` |
| `/unfiled/restaurant/:reservationUuid` | `unfiled_segment_restaurant` |
| `/trips/:tripUuid/restaurant/:segmentUuid/edit` | `segment_restaurant_edit` |
| `/unfiled/restaurant/:reservationUuid/edit` | `unfiled_segment_restaurant_edit` |

## Generic/API helper evidence

`index-C6qCNcMY.js` includes Restaurant in the generic type-to-slug map and in
the trip-object/unfiled-object family lists. It defines a generic read helper
equivalent to:

```text
GET v2/get/{type}/uuid/{uuid}
```

With the registry slug `restaurant` and the `/api/` base established by the
captured trip/profile requests, this gives a **bundle-implied** path equivalent to:

```text
GET /api/v2/get/restaurant/uuid/{uuid}
```

No request to that path appears in the HAR. The same bundle contains generic
create, replace-plan, and delete helpers, but no Restaurant mutation call or
request body was captured. The trip-object loader knows to look for a
`RestaurantObject` response property; its absence in this response does not prove
that the property is never returned.

## What is unknown

The HAR does not establish any RestaurantObject wire schema, including:

- direct field names or JSON types;
- nested objects or arrays and their cardinality;
- restaurant-specific type/detail codes;
- requiredness, null-versus-omitted behavior, validation, or limits;
- individual-read query parameters or response envelope;
- type-specific create/update/delete validation, payloads, and response shapes.

A Restaurant detail/edit capture with its network requests is required before this
page can document anything beyond the registry, SPA routes, and generic helper
mapping. There is intentionally no Restaurant JSON example.
