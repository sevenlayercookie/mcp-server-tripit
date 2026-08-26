# TripIt v2 `CruiseObject`

This page records only what can be established from the captured TripIt web application. It is reverse-engineered documentation, not an official API contract.

## Evidence and hard limits

The primary source is `www.tripit.com.har`. Its object-inclusive trip response contains `AirObject`, `LodgingObject`, and `CarObject`, but no `CruiseObject` key. No cruise instance payload, cruise-specific API response, or cruise-specific request is present in the HAR.

The fetched `TripItemTypes-CeicT-Cc.js` bundle does register cruise routes and the type registry described below. The cruise editor and viewer chunks are only referenced by those route declarations; they are not present as fetched HAR entries. Consequently, this page deliberately does not claim any cruise wire fields, nested schemas, cardinality, requiredness, or representative JSON payload.

## Registry mapping

The bundle’s type registry maps:

| Object key | Type code | Slug |
| --- | --- | --- |
| `CruiseObject` | `U` | `cruise` |

The `U` code and `CruiseObject` key come directly from the registry’s type-code-to-object map. The `cruise` slug is the registry’s route/API type slug.

## Registered SPA routes

These are route declarations in the fetched `TripItemTypes` bundle, not proof that the routes were navigated in this HAR. Each route passes `segmentName: "cruise"` and uses the `router.cruise_segment_page` route metadata.

| Route name | Path template | Referenced component |
| --- | --- | --- |
| `segment_cruise_create` | `/trips/{tripUuid}/cruise/create` | `edit-primary-Cs55jHPL.js` |
| `segment_cruise` | `/trips/{tripUuid}/cruise/{segmentUuid}` | `view-primary-CBcVrg75.js` |
| `unfiled_segment_cruise` | `/unfiled/cruise/{reservationUuid}` | `view-primary-CBcVrg75.js` |
| `segment_cruise_edit` | `/trips/{tripUuid}/cruise/{segmentUuid}/edit` | `edit-primary-Cs55jHPL.js` |
| `unfiled_segment_cruise_edit` | `/unfiled/cruise/{reservationUuid}/edit` | `edit-primary-Cs55jHPL.js` |

The component filenames above occur in the route table/dependency references. A direct search of HAR request URLs finds no fetched entry for any of these hash-named chunks, so their UI contents cannot be used as evidence here.

## Generic API-helper clues

The captured `app-dr-0NNJB.js` bundle contains generic helpers that map the cruise type code to the `cruise` slug:

| Operation | Code-derived path template | Method/body evidence |
| --- | --- | --- |
| Fetch an object | `v2/get/cruise/uuid/{uuid}` | `GET`; helper calls `.json()` |
| Create | `v2/create` | `POST` with a JSON body supplied by the caller |
| Replace/update a plan | `v2/replacePlan/cruise/uuid/{uuid}` | `POST` with a JSON body supplied by the caller |
| Delete an object | `v2/delete/cruise/uuid/{uuid}` | `POST` |
| Delete a segment | `v2/delete/segment/uuid/{uuid}` | `POST`; type is not in the path |

These are bundle-derived helper templates only. No cruise-specific create, fetch, update, or delete request is captured. The captured trip fetch is the generic object-inclusive form:

```text
GET /api/v2/get/trip/uuid/{trip_uuid}/include_objects/true?exclude_types=weather&should_get_new_seat_tracker_subscriptions=true
```

That response did not include a `CruiseObject` instance.

## Unknowns

The HAR cannot establish:

- Any `CruiseObject` wire field names or JSON types.
- Whether the root value is a singleton object, an array, or both depending on response context.
- Required versus optional fields, null behavior, validation, or update semantics.
- Nested segment, traveler/passenger, cabin, ship, agency, date/time, document, or other object shapes.
- Cruise-specific UI labels or editor behavior.
- A representative cruise payload.

No v1 documentation or assumptions have been carried into this page. A cruise response capture and the actual lazy-loaded cruise chunks are required before documenting a schema.
