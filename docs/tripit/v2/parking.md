# TripIt v2 `ParkingObject`

This page records only what can be established from the captured TripIt web application. It is reverse-engineered documentation, not an official API contract.

## Evidence and hard limits

The primary source is `www.tripit.com.har`. Its object-inclusive trip response contains `AirObject`, `LodgingObject`, and `CarObject`, but no `ParkingObject` key. No parking instance payload, parking-specific API response, or parking-specific request is present in the HAR.

The fetched `TripItemTypes-CeicT-Cc.js` bundle does register parking routes and the type registry described below. The parking editor and viewer chunks are only referenced by those route declarations; they are not present as fetched HAR entries. Consequently, this page deliberately does not claim any parking wire fields, nested schemas, cardinality, requiredness, or representative JSON payload.

## Registry mapping

The bundle’s type registry maps:

| Object key | Type code | Slug |
| --- | --- | --- |
| `ParkingObject` | `P` | `parking` |

The `P` code and `ParkingObject` key come directly from the registry’s type-code-to-object map. The `parking` slug is the registry’s route/API type slug.

## Registered SPA routes

These are route declarations in the fetched `TripItemTypes` bundle, not proof that the routes were navigated in this HAR. Each route passes `segmentName: "parking"` and uses the `router.parking_segment_page` route metadata.

| Route name | Path template | Referenced component |
| --- | --- | --- |
| `segment_parking_create` | `/trips/{tripUuid}/parking/create` | `edit-primary-4AFybx31.js` |
| `segment_parking` | `/trips/{tripUuid}/parking/{segmentUuid}` | `view-primary-Br8znK6W.js` |
| `unfiled_segment_parking` | `/unfiled/parking/{reservationUuid}` | `view-primary-Br8znK6W.js` |
| `segment_parking_edit` | `/trips/{tripUuid}/parking/{segmentUuid}/edit` | `edit-primary-4AFybx31.js` |
| `unfiled_segment_parking_edit` | `/unfiled/parking/{reservationUuid}/edit` | `edit-primary-4AFybx31.js` |

The component filenames above occur in the route table/dependency references. A direct search of HAR request URLs finds no fetched entry for any of these hash-named chunks, so their UI contents cannot be used as evidence here.

## Generic API-helper clues

The captured `app-dr-0NNJB.js` bundle contains generic helpers that map the parking type code to the `parking` slug:

| Operation | Code-derived path template | Method/body evidence |
| --- | --- | --- |
| Fetch an object | `v2/get/parking/uuid/{uuid}` | `GET`; helper calls `.json()` |
| Create | `v2/create` | `POST` with a JSON body supplied by the caller |
| Replace/update a plan | `v2/replacePlan/parking/uuid/{uuid}` | `POST` with a JSON body supplied by the caller |
| Delete an object | `v2/delete/parking/uuid/{uuid}` | `POST` |
| Delete a segment | `v2/delete/segment/uuid/{uuid}` | `POST`; type is not in the path |

These are bundle-derived helper templates only. No parking-specific create, fetch, update, or delete request is captured. The captured trip fetch is the generic object-inclusive form:

```text
GET /api/v2/get/trip/uuid/{trip_uuid}/include_objects/true?exclude_types=weather&should_get_new_seat_tracker_subscriptions=true
```

That response did not include a `ParkingObject` instance.

## Unknowns

The HAR cannot establish:

- Any `ParkingObject` wire field names or JSON types.
- Whether the root value is a singleton object, an array, or both depending on response context.
- Required versus optional fields, null behavior, validation, or update semantics.
- Nested segment, traveler/passenger, valet, agency, date/time, document, or other object shapes.
- Parking-specific UI labels or editor behavior.
- A representative parking payload.

No v1 documentation or assumptions have been carried into this page. A parking response capture and the actual lazy-loaded parking chunks are required before documenting a schema.
