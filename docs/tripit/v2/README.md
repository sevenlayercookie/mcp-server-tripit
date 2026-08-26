# TripIt v2 plan objects

This directory documents the plan-object surface visible in the captured
`www.tripit.com.har` browser session. The v2 API is undocumented, so these
pages describe observations rather than a stable or official contract.

The capture was recorded on 2026-08-26 and contains one successful trip read:

```http
GET /api/v2/get/trip/uuid/{trip_uuid}/include_objects/true
    ?exclude_types=weather
    &should_get_new_seat_tracker_subscriptions=true
```

The response is a top-level JSON object. It includes `timestamp`, `num_bytes`,
`Trip`, `Profile`, and one property per returned plan-object family. The sample
contains payloads for air, car, and lodging plans only.

## Evidence levels

Each page distinguishes among three kinds of evidence:

- **Payload-observed**: a field or shape occurs in the captured JSON response.
- **Frontend-observed**: a name, type code, slug, or UI route occurs in the
  captured JavaScript bundles.
- **Inferred**: a likely meaning derived from a field name or UI usage. An
  inference is not proof that the server accepts a field on writes.

Field presence, nullability, accepted values, write semantics, and cardinality
cannot be established from a single response. In particular, JSON scalar
values such as IDs and booleans are frequently serialized as strings.

## Object inventory

The captured `TripItemTypes` frontend registry maps 12 plan type codes to API
object names. All 12 are documented here, including objects that were named by
the registry but absent from the captured trip payload.

| Type code | Response property | SPA slug | API-helper slug | Payload in capture | Documentation |
| --- | --- | --- | --- | --- | --- |
| `A` | `AirObject` | `flight` / `flights` | `air` | Array | [Air](air.md) |
| `H` | `LodgingObject` | `lodging` | `lodging` | Array | [Lodging](lodging.md) |
| `C` | `CarObject` | `car-rental` | `car` | Object | [Car](car.md) |
| `L` | `RailObject` | `rail` | `rail` | Not present | [Rail](rail.md) |
| `T` | `TransportObject` | `transport` | `transport` | Not present | [Transport](transport.md) |
| `U` | `CruiseObject` | `cruise` | `cruise` | Not present | [Cruise](cruise.md) |
| `R` | `RestaurantObject` | `restaurant` | `restaurant` | Not present | [Restaurant](restaurant.md) |
| `Y` | `ActivityObject` | `activity` | `activity` | Not present | [Activity](activity.md) |
| `N` | `NoteObject` | `note` | `note` | Not present | [Note](note.md) |
| `D` | `DirectionsObject` | `direction` | `directions` | Not present | [Directions](directions.md) |
| `P` | `ParkingObject` | `parking` | `parking` | Not present | [Parking](parking.md) |
| `M` | `MapObject` | `map` | `map` | Not present | [Map](map.md) |

The same bundle defines `W` (weather) and `O` (layover) type codes, but does
not map either code to a plan-object response property. Weather was also
explicitly excluded by the captured trip request. They are therefore not
included in the 12-object registry documented here.

## Frontend routes are not API endpoints

For each registered object, the bundle exposes browser routes for creating,
viewing, and editing filed plans, plus viewing and editing unfiled plans. A
typical route family is:

```text
/trips/{tripUuid}/{slug}/create
/trips/{tripUuid}/{slug}/{segmentUuid}
/trips/{tripUuid}/{slug}/{segmentUuid}/edit
/unfiled/{slug}/{reservationUuid}
/unfiled/{slug}/{reservationUuid}/edit
```

These are SPA routes, not evidence of corresponding HTTP API endpoints. Air
uses the filed slug `flights` and unfiled slug `flight`; car uses `car-rental`.
The remaining objects use the SPA slugs shown in the inventory.

## Bundle-defined API helpers

A separate map in the captured frontend bundle associates each type code with
the API-helper slug shown above. Generic helpers construct these relative paths:

| Operation | Method and path |
| --- | --- |
| Read one | `GET /api/v2/get/{api_slug}/uuid/{uuid}` |
| Create | `POST /api/v2/create` with a caller-supplied JSON body |
| Replace | `POST /api/v2/replacePlan/{api_slug}/uuid/{uuid}` with JSON |
| Move | `GET /api/v2/move/{api_slug}/uuid/{uuid}?trip_uuid={trip_uuid}` |
| Delete object | `POST /api/v2/delete/{api_slug}/uuid/{uuid}` |
| Delete segment | `POST /api/v2/delete/segment/uuid/{uuid}` |

These methods and templates are frontend-code evidence. Apart from the captured
trip read, the HAR does not contain successful requests proving that the server
accepts them, nor does it reveal their request or response schemas.

## Privacy and examples

The HAR includes account and itinerary data. The documentation intentionally
uses synthetic UUIDs, IDs, names, locations, confirmation values, and URLs.
Examples preserve observed JSON structure and scalar types but are not copied
records and should not be treated as runnable fixtures.
