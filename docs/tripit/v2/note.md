# TripIt v2 `NoteObject`

## Scope and evidence

This page records only what the captured [`www.tripit.com.har`](./www.tripit.com.har)
establishes for the Note plan family. The HAR contains no NoteObject payload and
no deserialized NoteObject instance. A wire-field table, nested schema,
cardinality claim, and representative JSON example therefore cannot be derived
and are intentionally omitted.

The evidence comes from `TripItemTypes-CeicT-Cc.js` (registry and route bundle) and
generic reservation/API code in `index-C6qCNcMY.js`. The active browser page was a
car-rental page; this is a single frontend capture, not an official API
description.

Evidence labels:

- **Payload-observed:** occurs in the captured response body. None is available for
  NoteObject.
- **Frontend-observed:** appears in a JavaScript response captured by the HAR.
- **Inferred:** interpretation only; it is not a server contract.

## Registry entry

The frontend registry declares the following mapping:

| Type code | Response property | Frontend slug | Payload in this HAR |
| --- | --- | --- | --- |
| `N` | `NoteObject` | `note` | Not present |

The successful trip-read response has root keys `AirObject`, `CarObject`,
`LodgingObject`, `Profile`, `Trip`, `timestamp`, and `num_bytes`; it does not have
`NoteObject`.

## Exact SPA route family

`TripItemTypes-CeicT-Cc.js` declares these **browser SPA routes**. They are route
patterns, not proof of corresponding HTTP endpoints:

| SPA path | Route name |
| --- | --- |
| `/trips/:tripUuid/note/create` | `segment_note_create` |
| `/trips/:tripUuid/note/:segmentUuid` | `segment_note` |
| `/unfiled/note/:reservationUuid` | `unfiled_segment_note` |
| `/trips/:tripUuid/note/:segmentUuid/edit` | `segment_note_edit` |
| `/unfiled/note/:reservationUuid/edit` | `unfiled_segment_note_edit` |

## Generic/API helper evidence

`index-C6qCNcMY.js` includes Note in the generic type-to-slug map and in the
trip-object/unfiled-object family lists. It defines a generic read helper
equivalent to:

```text
GET v2/get/{type}/uuid/{uuid}
```

With the registry slug `note` and the `/api/` base established by the captured
trip/profile requests, this gives a **bundle-implied** path equivalent to:

```text
GET /api/v2/get/note/uuid/{uuid}
```

No request to that path appears in the HAR. The same bundle contains generic
create, replace-plan, and delete helpers, but no Note mutation call or request
body was captured. The trip-object loader knows to look for a `NoteObject`
response property; its absence in this response does not prove that the property
is never returned.

## What is unknown

The HAR does not establish any NoteObject wire schema, including:

- direct field names or JSON types;
- nested objects or arrays and their cardinality;
- note-specific type/detail codes;
- requiredness, null-versus-omitted behavior, validation, or limits;
- individual-read query parameters or response envelope;
- type-specific create/update/delete validation, payloads, and response shapes.

A Note detail/edit capture with its network requests is required before this page
can document anything beyond the registry, SPA routes, and generic helper mapping.
There is intentionally no Note JSON example.
