# TripIt v2 `LodgingObject`

## Scope and evidence

This is reverse-engineered documentation of the `LodgingObject` shape observed in
`www.tripit.com.har`. It is not an official TripIt schema. The HAR contains one
authenticated browser capture (2026-08-26) and two lodging records; field absence
therefore means “not present in this capture”, not “rejected by the API”. Values in
the example below are synthetic. Identifiers, confirmation numbers, contact data,
addresses, and opaque URLs from the capture are intentionally omitted or replaced.

Evidence is separated as follows:

- **Observed** means the raw JSON returned by the captured response.
- **Client model** means behavior or fields found in the JavaScript bundles also
  captured by the HAR. The client model is useful corroboration, but is not proof
  that the server accepts every field it defines.
- **Inferred** means a semantic interpretation based on a field name, value shape,
  or client behavior rather than an explicit API description.

## Where it appears

The captured response is a `GET` to the following sanitized path:

```text
/api/v2/get/trip/uuid/{tripUuid}/include_objects/true?exclude_types=weather&should_get_new_seat_tracker_subscriptions=true
```

The JSON envelope contains `LodgingObject` alongside the other plan-object keys.
In this response, `LodgingObject` is an array with **2** elements. Each element is
a reservation-level lodging object. The raw response also has `Trip`, `Profile`,
`AirObject`, `CarObject`, `timestamp`, and `num_bytes` siblings; those are outside
this object’s schema.

The two records had different optional-field coverage. The tables below use `2/2`
or `1/2` to show how many of the two captured records contained a field. This is
sample coverage, not a required/optional declaration.

## Top-level wire fields

All scalar values in the captured lodging records—including flags and numeric-looking
IDs—are JSON **strings**. The nested date and address values are JSON objects.

| JSON field | Type in HAR | Presence | Meaning and evidence |
| --- | --- | ---: | --- |
| `id` | string (numeric-looking) | 2/2 | **Observed:** lodging object ID. The extracted lodging serializer does not map an `id` property, so preservation/forwarding by the web client is uncertain. |
| `uuid` | string | 2/2 | **Observed / client model:** lodging reservation UUID. Mapped to the model’s `uuid`. |
| `trip_id` | string (numeric-looking) | 2/2 | **Observed:** numeric-looking parent trip ID. It is not separately mapped by the extracted lodging serializer. |
| `trip_uuid` | string | 2/2 | **Observed / client model:** UUID of the containing trip; mapped to `tripUuid`. |
| `is_client_traveler` | string (`"true"`/`"false"` form) | 2/2 | **Observed / client model:** whether the current account is the client traveler. The client deserializer converts the recognized string form to a Boolean. |
| `relative_url` | string (path) | 2/2 | **Observed / client model:** relative link for the reservation detail page; the captured values had the `/reservation/show/uuid/...` form. |
| `display_name` | string | 2/2 | **Observed / client model:** user-facing lodging title. |
| `is_display_name_auto_generated` | string (`"true"`/`"false"` form) | 2/2 | **Observed / client model:** flag indicating that the title was generated rather than explicitly supplied. The client converts it to a Boolean and uses it when deciding whether a display name exists. |
| `last_modified` | string (numeric-looking) | 2/2 | **Observed / client model:** last-modification value. The client converts it with `Number(...)` and passes it to a date/time helper; epoch-seconds interpretation is **inferred** from that code path. |
| `booking_rate` | string | 1/2 | **Observed / client model:** free-form booking/rate text, not a normalized numeric amount. |
| `booking_site_conf_num` | string | 1/2 | **Observed / client model:** confirmation/reference supplied by the intermediary booking site. Sensitive values are not reproduced here. |
| `booking_site_name` | string | 1/2 | **Observed / client model:** intermediary booking-site name. |
| `booking_site_url` | string (URL) | 1/2 | **Observed / client model:** intermediary booking-site URL. Opaque or signed query strings should be treated as sensitive. |
| `supplier_conf_num` | string | 2/2 | **Observed / client model:** supplier/property confirmation number. Sensitive values are not reproduced here. |
| `supplier_name` | string | 2/2 | **Observed / client model:** lodging supplier or property name. |
| `supplier_phone` | string | 1/2 | **Observed / client model:** supplier phone contact. The value is intentionally omitted. |
| `supplier_url` | string (URL) | 1/2 | **Observed / client model:** supplier/property URL. The captured opaque URL is intentionally omitted. |
| `is_purchased` | string (`"true"`/`"false"` form) | 2/2 | **Observed / client model:** whether the plan is booked/purchased. The client converts the string form to a Boolean. |
| `notes` | string | 2/2 | **Observed:** free-form lodging notes; the client model exposes the same field. |
| `restrictions` | string | 1/2 | **Observed / client model:** free-form restrictions or cancellation terms. |
| `total_cost` | string | 2/2 | **Observed / client model:** formatted total-cost text including currency in the sample; it is not a numeric amount field. |
| `is_tripit_booking` | string (`"true"`/`"false"` form) | 2/2 | **Observed / client model:** whether the booking originated as a TripIt booking. The client treats it as a read-only Boolean. |
| `has_possible_cancellation` | string (`"true"`/`"false"` form) | 2/2 | **Observed / client model:** cancellation-possibility flag. The client treats it as a read-only Boolean. Exact business rules are unknown. |
| `is_concur_booked` | string (`"true"`/`"false"` form) | 2/2 | **Observed:** flag present in both raw records. It does not occur in the extracted lodging serializer; a Concur-related booking state is only **inferred** from the name. |
| `StartDateTime` | object | 2/2 | **Observed / client model:** lodging start/check-in date and time. The client maps it to `startDateTime`. |
| `EndDateTime` | object | 2/2 | **Observed / client model:** lodging end/check-out date and time. The client maps it to `endDateTime`. |
| `Address` | object | 2/2 | **Observed / client model:** lodging location/address. The client maps its `address` member to a display-address property. |
| `Guest` | object | 1/2 | **Observed:** a singleton guest object in one record; absent in the other. The client exposes guests as a `travelers[]` array (see below). |
| `number_guests` | string (numeric-looking) | 1/2 | **Observed / client model:** number of guests, represented on the wire as text. Numeric-count semantics are **inferred** from the name and UI label. |
| `room_type` | string | 1/2 | **Observed / client model:** free-form room/accommodation description. |

### Boolean and numeric coercion

The raw response should be parsed according to its JSON types, not according to
the apparent meaning of a value. The captured flags are strings, not JSON Boolean
values. In `index-C6qCNcMY.js`, the generic serializer converts recognized
`"true"`/`"false"` strings to in-memory Booleans for mapped fields. Conversely,
`number_guests`, `id`, `trip_id`, and `last_modified` arrive as strings; only the
client’s `last_modified` path explicitly coerces a value to a number before date
handling.

## Nested wire objects

### `StartDateTime` and `EndDateTime`

Both nested date objects had the same five keys in both records. The two objects
use the same shape; their meaning differs by position: start is check-in and end
is check-out.

| Nested field | Type in HAR | Presence | Meaning and evidence |
| --- | --- | ---: | --- |
| `date` | string (`YYYY-MM-DD` shape) | 2/2 per date object | **Observed / client model:** calendar date. |
| `time` | string (`HH:MM:SS` shape) | 2/2 per date object | **Observed / client model:** local clock time. |
| `timezone` | string | 2/2 per date object | **Observed / client model:** timezone identifier used with the local date/time. The client also derives an `isTimezoneKnown` value, which is not a wire field. |
| `utc_offset` | string (`±HH:MM` shape) | 2/2 per date object | **Observed / client model:** UTC offset associated with the date/time. The client marks this value read-only. |
| `is_timezone_manual` | string (`"true"`/`"false"` form) | 2/2 per date object | **Observed / client model:** manual-timezone flag. The client converts it to a Boolean. |

The `V` date serializer in `index-C6qCNcMY.js` also defines a client-side
`preferred_timezone` string and derived `isTimeKnown`/`isTimezoneKnown` properties;
none appeared in either raw nested object. The client can deserialize a bare date
string into a date object, but the captured lodging response used the nested form.

### `Address`

`Address` was an object in both records with all seven of the following keys:

| Nested field | Type in HAR | Presence | Meaning and evidence |
| --- | --- | ---: | --- |
| `address` | string | 2/2 | **Observed / client model:** display-formatted address text. |
| `city` | string | 2/2 | **Observed:** city/locality component. |
| `state` | string | 2/2 | **Observed:** state, province, or region component. |
| `zip` | string | 2/2 | **Observed:** postal code. |
| `country` | string | 2/2 | **Observed:** country code/text as returned by the service. |
| `latitude` | string (numeric-looking) | 2/2 | **Observed / inferred:** latitude coordinate represented as text. |
| `longitude` | string (numeric-looking) | 2/2 | **Observed / inferred:** longitude coordinate represented as text. |

The captured `Address-Hl9pc1FK.js` model calls the raw `address` field
`displayAddress` and also defines optional `addr1` and `addr2` members. `addr1`
and `addr2` were not present in either captured address, so their wire support is
not established here.

### `Guest`

The raw response contained one `Guest` object (not an array) in one of the two
records. Its only observed key was:

| Nested field | Type in HAR | Presence | Meaning and evidence |
| --- | --- | ---: | --- |
| `frequent_traveler_supplier` | string | 1/2 overall | **Observed / client model:** supplier/program associated with the guest’s frequent-traveler account. The actual value is omitted. |

The lodging model in `ActivityObject-BGf0RlZP.js` maps `Guest` through the generic
array deserializer and exposes the result as `travelers[]`. The generic helper is
used for both collection-valued and singleton-shaped response members elsewhere
in the same bundle, so consumers should not assume that a raw `Guest` is always an
array based on the client property name. The following additional guest fields are
defined by the client model but were not observed in this response:

| Possible client field | Client type | Capture status |
| --- | --- | ---: |
| `first_name`, `middle_name`, `last_name` | string | 0/2 |
| `frequent_traveler_num` | string | 0/2 |
| `frequent_traveler_supplier` | string | 1/2 |
| `meal_preference`, `seat_preference` | string | 0/2 |
| `ticket_num` | string | 0/2 |

Names, loyalty numbers, and ticket numbers should be treated as personal data even
when the API returns them in a guest object.

## Client-model fields not observed in this response

The lodging serializer (`Fl` in `index-C6qCNcMY.js`) extends a generic reservation
serializer. Its model map contains the following additional nullable/optional
fields, none of which occurred in either raw `LodgingObject` record. These are
client-schema clues only; they are not confirmed server requirements.

| JSON key | Client type | Capture status | Meaning suggested by model field |
| --- | --- | ---: | --- |
| `CancellationDateTime` | object (`DateTime`) | 0/2 | Cancellation timestamp. |
| `booking_date` | string | 0/2 | Date associated with the booking. |
| `booking_site_phone` | string | 0/2 | Booking-site phone contact. |
| `booking_site_email_address` | string | 0/2 | Booking-site email contact. |
| `record_locator` | string | 0/2 | Read-only record locator. |
| `supplier_contact` | string | 0/2 | Free-form supplier contact. The booking-info UI adds this field for lodging. |
| `supplier_email_address` | string | 0/2 | Supplier email contact. |
| `EstimatedStartDateTime` | object (`DateTime`) | 0/2 | Estimated start/check-in date/time. |
| `EstimatedEndDateTime` | object (`DateTime`) | 0/2 | Estimated end/check-out date/time. |
| `number_rooms` | string | 0/2 | Number of rooms, displayed as text by the client. |
| `Agency` | object | 0/2 | Travel-agency details; nested shape is below. |

The generic reservation base also maps an optional `Creator` value and an optional
`Image` object/array to the client’s `creator` and `documents[]` properties. Neither
appeared in this lodging response. The client-side image shape has `uuid`,
`segment_uuid`, `url`, `thumbnail_url`, and `caption` string fields; upload-only
serialization additionally mentions `mime_type` and `base64_content`. This is not
evidence that those upload fields are returned by the trip endpoint.

### Client-only `Agency` shape

When present, the model expects `Agency` to contain string fields:

```text
agency_conf_num
agency_name
agency_phone
agency_email_address
agency_url
agency_contact
```

No `Agency` object was captured. The field names and UI use indicate travel-agency
contact data; values should be handled as sensitive.

## Lodging segments in the web client

There is no `Segment` array in either raw lodging record. Instead, the captured
client code creates two synthetic `LodgingSegment` instances when it deserializes
an object:

- one copy has `isCheckIn = true` and represents check-in;
- one copy has `isCheckIn = false` and represents check-out;
- their client segment keys are derived as `{uuid}-checkin` and `{uuid}-checkout`;
- `getCheckInSegment()` and `getCheckOutSegment()` select the two copies.

This explains why the route parameter is named `segmentUuid` even though the trip
response carries the lodging-level `uuid` and top-level `StartDateTime`/
`EndDateTime`, rather than a raw segment collection. It is a client representation,
not an assertion that the API has no segment-level endpoint.

## Endpoint and UI clues from the captured bundles

The following clues are evidenced by JavaScript files included in the HAR; only the
trip-fetch URL above was actually requested for lodging data in this capture.

- `TripItemTypes-CeicT-Cc.js` maps the lodging reservation type code `H` to
  `LodgingObject`, and maps the UI segment name `lodging` to that type.
- The same bundle declares routes for `/trips/:tripUuid/lodging/create`,
  `/trips/:tripUuid/lodging/:segmentUuid`, `/unfiled/lodging/:reservationUuid`,
  and their edit variants.
- `index-C6qCNcMY.js` defines a type-specific read helper equivalent to
  `GET /api/v2/get/lodging/uuid/{uuid}`. It also contains generic create, replace,
  and delete helpers; no such lodging mutation request appears in the HAR, so
  those paths are bundle-defined clues rather than captured API behavior.
- `en-US-BL_4hUBr.js` labels the lodging UI with `Room Info`, `Booking Info`,
  `Guests`, `Travel Agency Info`, and `Lodging Info`. Segment labels include
  check-in/check-out, confirmation, room description, number of rooms/guests,
  duration, address, phone, website, and email.
- `more-details-6dKrRbhO.js` uses `bookingSiteName`, booking-site confirmation,
  website, phone, booking date, booking rate, restrictions, and (for lodging)
  `supplierContact` in its Booking Info section. Its traveler section exposes
  guest name, frequent-traveler number, and ticket number when available.
- `customSectionCollapsedString()` in `ActivityObject-BGf0RlZP.js` joins
  `roomType`, `numberOfRooms`, and `numberOfGuests`, indicating that those values
  are intended as a compact Lodging Info summary when present.

Because the HAR was captured on a car-rental page, a lodging-specific view bundle
was not requested. The UI conclusions above come from shared components, route
declarations, the lodging model, and localization strings—not from a rendered
lodging page in this capture.

## Sanitized representative example

Every value below is synthetic. Angle-bracket values are placeholders, not copied
from the HAR; sensitive fields are shown only to make their locations explicit.

```json
{
  "id": "<lodging-id>",
  "uuid": "<lodging-uuid>",
  "trip_id": "<trip-id>",
  "trip_uuid": "<trip-uuid>",
  "is_client_traveler": "true",
  "relative_url": "/reservation/show/uuid/<lodging-uuid>",
  "display_name": "Example Hotel",
  "is_display_name_auto_generated": "false",
  "last_modified": "1700000000",
  "booking_rate": "USD 180/night",
  "booking_site_conf_num": "<redacted>",
  "booking_site_name": "Example Booking Site",
  "booking_site_url": "https://example.invalid/",
  "supplier_conf_num": "<redacted>",
  "supplier_name": "Example Hotel",
  "supplier_phone": "<redacted>",
  "supplier_url": "https://example.invalid/property",
  "is_purchased": "true",
  "notes": "Example lodging note.",
  "restrictions": "Example cancellation terms.",
  "total_cost": "USD 540.00",
  "is_tripit_booking": "false",
  "has_possible_cancellation": "false",
  "is_concur_booked": "false",
  "StartDateTime": {
    "date": "2025-07-12",
    "time": "15:00:00",
    "timezone": "UTC",
    "utc_offset": "+00:00",
    "is_timezone_manual": "false"
  },
  "EndDateTime": {
    "date": "2025-07-15",
    "time": "11:00:00",
    "timezone": "UTC",
    "utc_offset": "+00:00",
    "is_timezone_manual": "false"
  },
  "Address": {
    "address": "<redacted address>",
    "city": "Example City",
    "state": "EX",
    "zip": "00000",
    "country": "US",
    "latitude": "0.000000",
    "longitude": "0.000000"
  },
  "Guest": {
    "frequent_traveler_supplier": "Example Supplier"
  },
  "number_guests": "2",
  "room_type": "Deluxe room"
}
```

## Coverage and open questions

- **Covered:** all 30 top-level keys observed across the two captured
  `LodgingObject` records, all seven observed `Address` keys, all five observed
  date-time keys, and the one observed `Guest` key.
- **Not established:** server-side requiredness, accepted enums, null-versus-omitted
  behavior, maximum lengths, mutation request bodies, and whether the endpoint
  always returns `LodgingObject` as an array.
- `is_concur_booked`, `id`, and `trip_id` are present on the wire but are not mapped
  by the extracted lodging client serializer; their lifecycle and semantics need a
  separate API or additional capture.
- A second capture containing a lodging detail/edit page would be needed to verify
  the individual read endpoint, mutation payloads, rendered field visibility, and
  the actual cardinality rules for `Guest` and any optional `Segment`/`Image` data.
