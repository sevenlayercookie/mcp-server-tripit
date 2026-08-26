# TripIt v2 `RailObject`

This page records only what can be established from the captured TripIt web application. It is reverse-engineered documentation, not an official API contract.

## Evidence and hard limits

The primary source is `www.tripit.com.har`. Its object-inclusive trip response contains `AirObject`, `LodgingObject`, and `CarObject`, but no `RailObject` key. No rail instance payload, rail-specific API response, or rail-specific request is present in the HAR.

The fetched `TripItemTypes-CeicT-Cc.js` bundle does register rail routes and the type registry described below. The rail editor and viewer chunks are only referenced by those route declarations; they are not present as fetched HAR entries. Consequently, this page deliberately does not claim any rail wire fields, nested schemas, cardinality, requiredness, or representative JSON payload.

## Registry mapping

The bundle’s type registry maps:

| Object key | Type code | Slug |
| --- | --- | --- |
| `RailObject` | `L` | `rail` |

The `L` code and `RailObject` key come directly from the registry’s type-code-to-object map. The `rail` slug is the registry’s route/API type slug.

## Registered SPA routes

These are route declarations in the fetched `TripItemTypes` bundle, not proof that the routes were navigated in this HAR. Each route passes `segmentName: "rail"` and uses the `router.rail_segment_page` route metadata.

| Route name | Path template | Referenced component |
| --- | --- | --- |
| `segment_rail_create` | `/trips/{tripUuid}/rail/create` | `edit-primary-BEcwrEZO.js` |
| `segment_rail` | `/trips/{tripUuid}/rail/{segmentUuid}` | `view-primary-qAfM3d0g.js` |
| `unfiled_segment_rail` | `/unfiled/rail/{reservationUuid}` | `view-primary-qAfM3d0g.js` |
| `segment_rail_edit` | `/trips/{tripUuid}/rail/{segmentUuid}/edit` | `edit-primary-BEcwrEZO.js` |
| `unfiled_segment_rail_edit` | `/unfiled/rail/{reservationUuid}/edit` | `edit-primary-BEcwrEZO.js` |

The component filenames above occur in the route table/dependency references. A direct search of HAR request URLs finds no fetched entry for any of these eight-character-hash chunks, so their UI contents cannot be used as evidence here.

## Generic API-helper clues

The captured `app-dr-0NNJB.js` bundle contains generic helpers that map the rail type code to the `rail` slug:

| Operation | Code-derived path template | Method/body evidence |
| --- | --- | --- |
| Fetch an object | `v2/get/rail/uuid/{uuid}` | `GET`; helper calls `.json()` |
| Create | `v2/create` | `POST` with a JSON body supplied by the caller |
| Replace/update a plan | `v2/replacePlan/rail/uuid/{uuid}` | `POST` with a JSON body supplied by the caller |
| Delete an object | `v2/delete/rail/uuid/{uuid}` | `POST` |
| Delete a segment | `v2/delete/segment/uuid/{uuid}` | `POST`; type is not in the path |

These are bundle-derived helper templates only. No rail-specific create, fetch, update, or delete request is captured. The captured trip fetch is the generic object-inclusive form:

```text
GET /api/v2/get/trip/uuid/{trip_uuid}/include_objects/true?exclude_types=weather&should_get_new_seat_tracker_subscriptions=true
```

That response did not include a `RailObject` instance.

## Unknowns

The HAR cannot establish:

- Any `RailObject` wire field names or JSON types.
- Whether the root value is a singleton object, an array, or both depending on response context.
- Required versus optional fields, null behavior, validation, or update semantics.
- Nested segment, traveler, agency, date/time, document, or other object shapes.
- Rail-specific UI labels or editor behavior.
- A representative rail payload.

No v1 documentation or assumptions have been carried into this page. A rail response capture and the actual lazy-loaded rail chunks are required before documenting a schema.
