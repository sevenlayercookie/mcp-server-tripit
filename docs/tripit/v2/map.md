# TripIt v2 `MapObject`

## Scope and evidence

This page records only evidence from the captured
[`www.tripit.com.har`](./www.tripit.com.har). It is reverse-engineered
documentation for an undocumented frontend/API, not an official TripIt
contract.

The capture's successful trip request was a `GET` to the trip-inclusion
endpoint below. Its response contained `Trip`, `AirObject`, `CarObject`,
`LodgingObject`, and `Profile`; it did not contain a `MapObject` instance.
The browser was on a car-rental page. No Map-specific HTTP request was
captured, and the Map editor/view chunks were referenced by the loaded route
table but were not fetched.

The labels below distinguish **HAR-observed** facts (a request, response,
asset, or literal in the capture) from **frontend-observed** facts (a route or
generic helper assembled by captured JavaScript). A path constructed by a
helper is not proof that the corresponding request succeeded or that its
payload has the shape suggested by the path.

## Registry identity

The captured `TripItemTypes` bundle defines this mapping:

| Registry entry | Type code | Registered response key | Frontend slug |
| --- | --- | --- | --- |
| `I.MAP` | `M` | `L[I.MAP] = "MapObject"` | `z[I.MAP] = "map"` |

The same bundle maps the route prop `segmentName` to the literal `"map"`.
Thus `MapObject`, code `M`, the SPA route slug `map`, and the API-helper slug
`map` below are related frontend names; they are not interchangeable
wire-field claims.

## Captured SPA routes

The route table in `TripItemTypes-CeicT-Cc.js` declares the following route
family. These are **frontend-observed route declarations**, not requests
seen in the HAR. The referenced type-specific assets do not appear as HAR
request URLs, so their component code and UI fields could not be inspected.

| Purpose | SPA path | Route name | Referenced chunk | Chunk fetched? |
| --- | --- | --- | --- | --- |
| Create in trip | `/trips/:tripUuid/map/create` | `segment_map_create` | `edit-primary-CaQRX_tp.js` | No |
| View in trip | `/trips/:tripUuid/map/:segmentUuid` | `segment_map` | `view-primary-CmkWvXNv.js` | No |
| View unfiled | `/unfiled/map/:reservationUuid` | `unfiled_segment_map` | `view-primary-CmkWvXNv.js` | No |
| Edit in trip | `/trips/:tripUuid/map/:segmentUuid/edit` | `segment_map_edit` | `edit-primary-CaQRX_tp.js` | No |
| Edit unfiled | `/unfiled/map/:reservationUuid/edit` | `unfiled_segment_map_edit` | `edit-primary-CaQRX_tp.js` | No |

The route metadata uses the frontend title key
`router.map_segment_page`. This is a localization key, not a server field or
endpoint name.

## Generic API-helper clues

The loaded `index-C6qCNcMY.js` bundle contains a type-to-path map with
`Gc[I.MAP] = "map"` and generic helpers equivalent to the following. The
captured HTTP client prefixes these relative paths with `/api`.

| Helper operation | Frontend-constructed path for code `M` | Evidence status |
| --- | --- | --- |
| Get one | `GET /api/v2/get/map/uuid/{uuid}` | Helper literal only; no such request in the HAR |
| Replace plan | `POST /api/v2/replacePlan/map/uuid/{uuid}` with a generic JSON argument | Helper literal only; payload shape unknown |
| Delete object | `POST /api/v2/delete/map/uuid/{uuid}` | Helper literal only; no such request in the HAR |
| Delete segment | `POST /api/v2/delete/segment/uuid/{uuid}` | Shared helper; not Map-specific and not captured |
| Move object | `GET /api/v2/move/map/uuid/{uuid}?trip_uuid={trip_uuid}` | Helper literal only; no such request in the HAR |
| Create object | `POST /api/v2/create` with a generic JSON argument | Shared helper; type/payload discriminator and schema unknown |

These rows document URL construction visible in the bundle, not confirmed
server routes, HTTP methods accepted by the server, authorization behavior,
or response envelopes. The only captured `/api/v2` plan-data request was the
trip-inclusion request described above.

## Wire schema and cardinality: not established

There is no `MapObject` payload in this HAR from which to enumerate fields.
Consequently the HAR cannot establish any of the following:

- direct fields, JSON types, nested objects, arrays, dates, coordinates, or
  text encodings;
- whether the response property is an object, array, singleton, or omitted
  when empty;
- field requiredness, omission rules, nullability, defaults, or accepted
  enum values;
- create, edit, move, delete, or unfiled-object payload shapes and responses;
- whether the generic helper's path is the complete wire endpoint contract;
  or
- a representative payload.

The absence of `MapObject` in one trip response is therefore not proof that
the type is unsupported or that its cardinality is zero. No fields are copied
from v1, and no synthetic example is supplied because doing so would invent
an unobserved schema.

## Coverage and uncertainties

Covered: the exact `M`/`MapObject`/`map` registry mapping, all five captured
SPA route variants (including unfiled routes), the referenced but unfetched
editor/view chunks, and the generic API-helper URL templates present in the
loaded bundle.

Unknown: the actual wire object, nesting and cardinality, read/write request
and response bodies, validation and authentication behavior, and all
Map-specific UI semantics. A capture that visits a Map route and records its
network requests, especially the type-specific chunks, is needed before
documenting fields.
