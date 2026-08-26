# TripIt v2 `AirObject` (flight reservation)

## Scope and evidence

This page documents the `AirObject` shape visible in the captured
[`www.tripit.com.har`](./www.tripit.com.har). It is reverse-engineered
documentation for an undocumented endpoint, not an official TripIt API
contract.

The capture was made on 2026-08-26. Its active browser page was a car-rental
detail page; the Air frontend code below was present in the shared JavaScript
bundles, but an Air detail page was not the page rendered in this capture.
The HAR also contains itinerary data, account data, cookies, and other
sensitive values. None of those values are reproduced here. The example uses
synthetic placeholders and is not a runnable fixture.

Evidence labels used below:

- **Payload-observed**: the property or shape occurs in the response body.
- **Frontend-observed**: the name, type mapping, route, UI label, or behavior
  occurs in a JavaScript response captured in the HAR.
- **Inferred**: a likely interpretation from a field name or frontend use;
  it is not proof of a server-side requirement, accepted value, unit, or write
  behavior.

Counts such as `2/2` and `8/8` mean “present in that many elements in this
capture.” They do not mean required fields. No `null` values occurred in the
captured `AirObject` subtree, so omission and nullability remain unknown.

## Where it appears

The HAR contains one successful request matching the following shape:

```http
GET https://www.tripit.com/api/v2/get/trip/uuid/{trip_uuid}/include_objects/true
    ?exclude_types=weather
    &should_get_new_seat_tracker_subscriptions=true
```

The observed request returned HTTP `200` with `application/json`. The response
is a top-level JSON object containing `timestamp`, `num_bytes`, `Trip`,
`Profile`, and plan-family properties. `AirObject` is a top-level property,
not nested inside `Trip`:

```json
{
  "timestamp": "...",
  "num_bytes": "...",
  "Trip": { "...": "..." },
  "AirObject": [ { "...": "..." } ],
  "CarObject": { "...": "..." },
  "LodgingObject": [ { "...": "..." } ],
  "Profile": { "...": "..." }
}
```

Payload cardinality observed in this response:

| Location | Observed shape/count | Notes |
| --- | --- | --- |
| `AirObject` | array of 2 objects | Each element is one flight reservation/plan. The array itself is payload-observed; an empty or singleton response was not captured. |
| `AirObject[].Segment` | array of 4 objects per reservation | Eight segment objects total. The frontend serializer can normalize a singleton or array, but the server-side cardinality rule is unknown. |
| `AirObject[].Traveler` | object, one per reservation | The raw response used a singleton object, not an array. The frontend deserializer normalizes `Traveler` through its array helper into the logical `travelers` list. |
| `Segment.StartDateTime` / `Segment.EndDateTime` | object, one each per segment | Sixteen date/time objects total. |
| `Segment.Status` | object, one per segment | Eight status objects total. |
| `Segment.Emissions` | object, one per segment | Eight emissions objects total; this nested object is present in the wire payload but is not mapped by the captured flight serializer. |

The raw response also contained `CarObject` and `LodgingObject`; those are
outside this page. The `AirObject` records were linked to the same trip by
both `trip_id` and `trip_uuid` in the observed payload.

## `AirObject` fields

The following table covers every direct key found in either captured
`AirObject` element. “Wire type” is the JSON type before frontend
deserialization. A scalar that looks numeric or boolean is still listed as a
`string` when that is what the HAR contains.

| Wire field | Wire type | Presence in capture | Frontend evidence / likely meaning |
| --- | --- | --- | --- |
| `id` | string | `2/2` | **Payload-observed.** Numeric-looking reservation identifier. **Inferred** legacy/internal numeric ID from its name and values; it is not included in the captured Air serializer map. |
| `uuid` | string | `2/2` | **Payload-observed.** Opaque reservation UUID; the frontend uses it as the reservation identity and in reservation URLs. |
| `trip_id` | string | `2/2` | **Payload-observed.** Numeric-looking parent-trip identifier. **Inferred** legacy/internal trip linkage; the captured serializer maps `trip_uuid`, not this key. |
| `trip_uuid` | string | `2/2` | **Payload-observed / frontend-observed.** Parent trip UUID; mapped to `tripUuid`. |
| `is_client_traveler` | string (`"true"`/`"false"`) | `2/2` | **Frontend-observed.** Mapped to Boolean `isClientTraveler`; **inferred** to indicate whether the current client/profile is a traveler on the reservation. |
| `relative_url` | string | `2/2` | **Payload-observed / frontend-observed.** Relative reservation-detail path, mapped to `relativeUrl`. |
| `display_name` | string | `2/2` | **Payload-observed / frontend-observed.** Reservation display label, mapped to `displayName`. |
| `is_display_name_auto_generated` | string (`"true"`/`"false"`) | `2/2` | **Frontend-observed.** Read-only Boolean mapping; indicates whether the display label was auto-generated. |
| `last_modified` | string | `2/2` | **Frontend-observed.** Mapped by a custom deserializer that converts `Number(last_modified)` to a date/time value. **Inferred** Unix-epoch-like timestamp; units were not stated by the payload. |
| `booking_date` | string | `2/2` | **Payload-observed / frontend-observed.** ISO date string for booking/import date; mapped to `bookingDate`. Exact business meaning is not independently established. |
| `booking_site_conf_num` | string | `2/2` | **Frontend-observed.** Mapped to `bookingSiteConfirmationNumber`; **inferred** confirmation/reference supplied by the booking site. Sensitive in real responses. |
| `booking_site_name` | string | `2/2` | **Frontend-observed.** Mapped to `bookingSiteName`; **inferred** booking-site/agency name. |
| `booking_site_phone` | string | `2/2` | **Frontend-observed.** Mapped to `bookingSitePhone`; **inferred** booking-site contact phone. |
| `booking_site_url` | string | `2/2` | **Frontend-observed.** Mapped to `bookingSiteUrl`; **inferred** booking-site URL. |
| `supplier_conf_num` | string | `2/2` | **Frontend-observed.** Mapped to `supplierConfirmationNumber`; **inferred** supplier/carrier confirmation reference. Sensitive in real responses. |
| `is_purchased` | string (`"true"`/`"false"`) | `2/2` | **Frontend-observed.** Mapped to Boolean `isPurchased`; UI exposes this through reservation/booking details. |
| `total_cost` | string | `2/2` | **Payload-observed / frontend-observed.** Formatted money text (the capture used a currency symbol, amount, and currency code), mapped to `totalCost`; it is not a numeric amount in this response. |
| `is_tripit_booking` | string (`"true"`/`"false"`) | `2/2` | **Frontend-observed.** Read-only Boolean mapping; **inferred** whether TripIt itself was the booking channel. |
| `has_possible_cancellation` | string (`"true"`/`"false"`) | `2/2` | **Frontend-observed.** Read-only Boolean mapping; **inferred** that TripIt detected possible cancellation information. |
| `is_concur_booked` | string (`"true"`/`"false"`) | `2/2` | **Payload-observed.** Boolean-looking Concur flag by name. It is not mapped by the captured Air serializer, so Concur semantics are **inferred** only. |
| `Segment` | array | `2/2` | **Payload-observed / frontend-observed.** Flight legs. The Air serializer maps the elements to `FlightSegment` models and attaches the reservation UUID to each model segment. |
| `Traveler` | object | `2/2` | **Payload-observed / frontend-observed.** Singleton passenger/traveler record in this response. The serializer maps it to the logical `travelers` list; see [Travelers](#traveler). |

### Fields declared by the frontend but absent here

The shared reservation model declares additional common fields that did not
occur in either captured Air object: `CancellationDateTime`, `booking_rate`,
`booking_site_email_address`, `record_locator`, `supplier_contact`,
`supplier_email_address`, `supplier_name`, `supplier_phone`, `supplier_url`,
`notes`, `restrictions`, and `Agency`. The common model also declares a
`documents` collection (serialized under an `Image` wrapper) and a `Creator`
field. These are **frontend-observed possible fields**, not payload-observed
Air fields in this HAR. The capture cannot establish whether all of them are
accepted on Air writes, returned only for some imported reservations, or
omitted by this particular request.

The `id`, `trip_id`, and `is_concur_booked` keys are the opposite case: they
occur in the wire response but are not present in the captured common/Air
serializer maps. A consumer that needs lossless forwarding should preserve
unknown keys rather than assuming the frontend model is exhaustive.

## `Segment` fields

Each of the eight captured segment objects had the following keys, except for
the carrier-specific fields marked `4/8`. Missing keys were omitted; no
`null` values were observed. A field appearing in `4/8` segments is
conditional in this sample (for example, operating-carrier data was present
on codeshare legs), not proven optional by the API.

### Identity, route, and times

| Wire field | Wire type | Presence | Frontend evidence / likely meaning |
| --- | --- | --- | --- |
| `id` | string | `8/8` | **Payload-observed.** Numeric-looking segment identifier. It is not in the captured `FlightSegment` serializer map; semantics are **inferred**. |
| `uuid` | string | `8/8` | **Payload-observed / frontend-observed.** Segment UUID, mapped to `uuid`; the frontend uses it to identify a segment. |
| `StartDateTime` | object | `8/8` | **Payload-observed / frontend-observed.** Departure date/time object; mapped to `startDateTime`. See [Date/time](#datetime-and-endpoint-time-objects). |
| `EndDateTime` | object | `8/8` | **Payload-observed / frontend-observed.** Arrival date/time object; mapped to `endDateTime`. See [Date/time](#datetime-and-endpoint-time-objects). |
| `Status` | object | `8/8` | **Payload-observed / frontend-observed.** Flight monitoring/status object; mapped to `flightStatus`. See [Status](#status). |
| `start_airport_code` | string | `8/8` | **Frontend-observed.** Origin airport code, mapped to `startAirportCode`; UI labels this as departure airport. |
| `start_airport_name` | string | `8/8` | **Frontend-observed.** Origin airport display name, mapped read-only to `startAirportName`. |
| `start_airport_latitude` | string | `8/8` | **Payload-observed.** Decimal-looking latitude string. **Inferred** geographic coordinate; not mapped by the captured flight serializer. |
| `start_airport_longitude` | string | `8/8` | **Payload-observed.** Decimal-looking longitude string. **Inferred** geographic coordinate; not mapped by the captured flight serializer. |
| `start_city_name` | string | `8/8` | **Frontend-observed.** Origin city display name, mapped to `startCityName`. |
| `start_country_code` | string | `8/8` | **Frontend-observed.** Origin country code, mapped to `startCountryCode`; code vocabulary is not declared in the bundle. |
| `end_airport_code` | string | `8/8` | **Frontend-observed.** Destination airport code, mapped to `endAirportCode`; UI labels this as arrival airport. |
| `end_airport_name` | string | `8/8` | **Frontend-observed.** Destination airport display name, mapped read-only to `endAirportName`. |
| `end_airport_latitude` | string | `8/8` | **Payload-observed.** Decimal-looking latitude string. **Inferred** geographic coordinate; not mapped by the captured flight serializer. |
| `end_airport_longitude` | string | `8/8` | **Payload-observed.** Decimal-looking longitude string. **Inferred** geographic coordinate; not mapped by the captured flight serializer. |
| `end_city_name` | string | `8/8` | **Frontend-observed.** Destination city display name, mapped to `endCityName`. |
| `end_country_code` | string | `8/8` | **Frontend-observed.** Destination country code, mapped to `endCountryCode`; code vocabulary is not declared in the bundle. |

### Carrier, flight, aircraft, and service

| Wire field | Wire type | Presence | Frontend evidence / likely meaning |
| --- | --- | --- | --- |
| `marketing_airline` | string | `8/8` | **Frontend-observed.** Marketing/ticketing airline name, mapped to `marketingAirline`. |
| `marketing_airline_code` | string | `8/8` | **Frontend-observed.** Marketing/ticketing airline code, mapped to `marketingAirlineCode`. |
| `marketing_flight_number` | string | `8/8` | **Frontend-observed.** Marketing flight number, mapped to `marketingFlightNumber`. |
| `operating_airline` | string | `4/8` | **Payload-observed / frontend-observed.** Operating carrier name, mapped to `operatingAirline`; present only on some captured legs. The UI describes the operating carrier as the plane/crew carrier in a codeshare display. |
| `operating_airline_code` | string | `4/8` | **Payload-observed / frontend-observed.** Operating carrier code, mapped to `operatingAirlineCode`; conditional in this sample. |
| `operating_flight_number` | string | `4/8` | **Payload-observed / frontend-observed.** Operating carrier flight number, mapped to `operatingFlightNumber`; conditional in this sample. |
| `aircraft` | string | `8/8` | **Frontend-observed.** Aircraft type/code, mapped to `aircraft`. |
| `aircraft_display_name` | string | `8/8` | **Frontend-observed.** Human-readable aircraft name, mapped read-only to `aircraftDisplayName`. |
| `service_class` | string | `8/8` | **Frontend-observed.** Mapped to `serviceClass`; the flight edit UI labels this field “Fare Class.” The exact fare/service vocabulary is **inferred**. |
| `stops` | string | `8/8` | **Payload-observed / frontend-observed.** Display text for stop count/type, mapped to `stops`; the captured values were text such as “nonstop,” not an integer. |
| `distance` | string | `8/8` | **Payload-observed / frontend-observed.** Display distance text, mapped to `distance`; units and parsing rules are not specified. |
| `duration` | string | `8/8` | **Payload-observed / frontend-observed.** Display duration text, mapped to `duration`; it is not a numeric duration in this response. |
| `is_international` | string (`"true"`/`"false"`) | `8/8` | **Frontend-observed.** Mapped to Boolean `isInternational`; **inferred** international-flight classification. Both Boolean-looking values occurred in the sample. |
| `does_cross_idl` | string (`"true"`/`"false"`) | `8/8` | **Payload-observed.** Boolean-looking flag by name; **inferred** whether the leg crosses the International Date Line. It is not mapped by the captured flight serializer. |
| `is_hidden` | string (`"true"`/`"false"`) | `8/8` | **Frontend-observed.** Read-only Boolean mapping; the frontend excludes hidden flight segments from some conflict checks. |
| `is_eligible_seattracker` | string (`"true"/"false"`) | `8/8` | **Payload-observed.** Seat-tracker eligibility flag by name. It is not mapped by the captured `FlightSegment` field map; exact product rules are unknown. |
| `is_eligible_airhelp` | string (`"true"/"false"`) | `8/8` | **Frontend-observed.** Read-only Boolean mapping to `isEligibleAirhelp`; **inferred** eligibility for the AirHelp UI feature. |

### Carrier and product links

All link fields were JSON strings when present. The captured frontend flight
field map only maps `check_in_url` (which was absent here); these other links
are visible in the payload but are not mapped by that field map.

| Wire field | Wire type | Presence | Frontend evidence / likely meaning |
| --- | --- | --- | --- |
| `refund_info_url` | string | `4/8` | **Payload-observed.** Carrier refund/cancellation information URL by name; conditional in this sample. |
| `change_reservation_url` | string | `8/8` | **Payload-observed.** Carrier change-reservation URL by name. |
| `mobile_change_reservation_url` | string | `4/8` | **Payload-observed.** Mobile change-reservation URL; conditional in this sample. |
| `customer_support_url` | string | `8/8` | **Payload-observed.** Carrier customer-support URL by name. |
| `mobile_customer_support_url` | string | `4/8` | **Payload-observed.** Mobile customer-support URL; conditional in this sample. |
| `general_fees_url` | string | `4/8` | **Payload-observed.** General-fees URL by name; conditional in this sample. |
| `web_home_url` | string | `8/8` | **Payload-observed.** Carrier web-home URL by name. |
| `mobile_home_url` | string | `4/8` | **Payload-observed.** Carrier mobile-home URL; conditional in this sample. |

The frontend declares a `check_in_url` field and a `conflict_resolution_url`
field on its flight segment model, but neither key occurred in the eight raw
segments. It also declares editable `start_gate`, `start_terminal`,
`end_gate`, `end_terminal`, `seats`, `entertainment`, `meal`, `notes`,
`ontime_perc`, and `baggage_claim` fields; none occurred in this response.
Those are frontend-declared possibilities, not observed values.

### Raw emissions object

| Wire field | Wire type | Presence | Frontend evidence / likely meaning |
| --- | --- | --- | --- |
| `Emissions` | object | `8/8` | **Payload-observed.** Nested object present on every captured segment. It is not included in the captured `FlightSegment` serializer map. |

See [Emissions](#emissions) for its only observed key. The HAR does not state
the unit or calculation method for the value.

## Nested schemas

### Date/time and endpoint time objects

`StartDateTime` and `EndDateTime` have the same observed shape. Every one of
the sixteen objects contained all five keys, and every value was a JSON
string. The endpoint names are camel-cased and capitalized exactly as shown.

| Field | Wire type | Presence | Meaning/evidence |
| --- | --- | --- | --- |
| `date` | string | `16/16` | **Payload-observed.** Calendar date in `YYYY-MM-DD` form in this capture. |
| `time` | string | `16/16` | **Payload-observed.** Local wall-clock time in `HH:MM:SS` form in this capture. The frontend declares it as a string and may support an unknown/blank time, but that was not observed. |
| `timezone` | string | `16/16` | **Payload-observed.** IANA-style timezone identifier in this capture. **Inferred** to identify the local timezone for the endpoint. |
| `utc_offset` | string | `16/16` | **Payload-observed / frontend-observed.** Signed UTC offset text; the frontend maps it as a read-only string. |
| `is_timezone_manual` | string (`"true"`/`"false"`) | `16/16` | **Frontend-observed.** Boolean-looking manual-timezone flag. The date serializer converts it to Boolean; its serializer derives the wire value from whether a timezone is set. |

The frontend date serializer also declares `preferred_timezone`, plus derived
`isTimeKnown` and `isTimezoneKnown` properties. None appeared in these raw
objects. The flight model uses `StartDateTime`/`EndDateTime` as the baseline
times and checks for optional scheduled/estimated times inside `Status` first;
because those status children were absent here, the captured UI model would
fall back to these endpoint times. That fallback statement is
**frontend-observed behavior**, not a claim that the API labels them
“scheduled.”

### `Status`

The eight `Status` objects in the response each contained only these two
keys:

| Field | Wire type | Presence | Meaning/evidence |
| --- | --- | --- | --- |
| `flight_status` | string | `8/8` | **Payload-observed / frontend-observed.** Status code string, mapped to `flightStatus.code`. All captured values were `"200"`. |
| `last_modified` | string | `8/8` | **Payload-observed / frontend-observed.** Numeric-looking status-update timestamp string, mapped to a Number by the serializer. Units are not stated. |

The `FlightSegment` bundle declares additional status keys that were absent
from this response: `is_connection_at_risk`, `departure_terminal`,
`departure_gate`, `arrival_terminal`, `arrival_gate`, `layover_minutes`,
`baggage_claim`, `diverted_airport_code`, `ScheduledDepartureDateTime`,
`ScheduledArrivalDateTime`, `EstimatedDepartureDateTime`, and
`EstimatedArrivalDateTime`. They should be treated as frontend-declared,
not payload-observed for this capture.

#### Frontend status code vocabulary

The captured `FlightSegment` bundle declares the following constants and the
English bundle supplies the corresponding labels. This is a
**frontend-observed mapping**, not a guarantee that the server accepts only
these values or that every status is returned as a string.

| Code | Frontend constant / English label |
| --- | --- |
| `100` | `NOT_MONITORABLE` / “Missing Info” |
| `200` | `NOT_MONITORED` / “Not Monitored” |
| `300` | `SCHEDULED` / “Scheduled” |
| `301` | `ON_TIME` / “On Time” |
| `302` | `IN_FLIGHT` / “In Flight - On Time” |
| `303` | `ARRIVED` / “Arrived - On Time” |
| `400` | `CANCELLED` / “Canceled” |
| `401` | `DELAYED` / “Delayed” |
| `402` | `IN_FLIGHT_LATE` / “In Flight - Late” |
| `403` | `ARRIVED_LATE` / “Arrived - Late” |
| `404` | `DIVERTED` / “Diverted” |
| `405` | `POSSIBLY_DELAYED` / “Possibly Delayed” |
| `406` | `IN_FLIGHT_POSSIBLY_LATE` / “In Flight - Possibly Late” |
| `407` | `ARRIVED_POSSIBLY_LATE` / “Arrived - Possibly Late” |
| `408` | `UNKNOWN` / “Can’t Monitor” |
| `900` | `AT_RISK` / “At Risk” |
| `901` | `CONFLICT` / “Conflict” |

The captured response used code `200` on every segment. The frontend status
class overrides the displayed code to `900` when its separate
`is_connection_at_risk` property is true; that property was not present in
this payload.

### `Emissions`

Each captured segment had an `Emissions` object with this shape:

| Field | Wire type | Presence | Meaning/evidence |
| --- | --- | --- | --- |
| `co2` | string | `8/8` | **Payload-observed.** Decimal-looking value by the field name. Unit, scope (per leg versus reservation), and calculation basis are unknown; do not treat it as a numeric quantity without external confirmation. |

### `Traveler`

The raw response used one `Traveler` object per AirObject. The frontend
serializer calls its array-normalization helper for `Traveler`, so its
logical model is `travelers: []` even though this singleton wire shape was
captured. The following six keys were present in both traveler objects:

| Wire field | Wire type | Presence | Frontend evidence / likely meaning |
| --- | --- | --- | --- |
| `first_name` | string | `2/2` | **Frontend-observed.** Mapped to traveler `firstName`; used to build the UI display name. |
| `middle_name` | string | `2/2` | **Frontend-observed.** Mapped to `middleName`; used when present in the computed display name. |
| `last_name` | string | `2/2` | **Frontend-observed.** Mapped to `lastName`; used to build the UI display name. |
| `frequent_traveler_num` | string | `2/2` | **Frontend-observed.** Mapped to `frequentTravelerNumber`; UI labels this as a traveler/loyalty number. Sensitive in real responses. |
| `frequent_traveler_supplier` | string | `2/2` | **Frontend-observed.** Mapped to `frequentTravelerSupplier`; **inferred** loyalty-program/provider name. |
| `ticket_num` | string | `2/2` | **Frontend-observed.** Mapped to `ticketNumber`; UI exposes this under passenger details. Sensitive in real responses. |

The traveler model also declares `meal_preference` and `seat_preference`,
but neither key occurred in this response. No traveler UUID, email, phone,
address, or explicit seat assignment occurred in the captured AirObject
subtree.

## Frontend mapping and behavior clues

The following details are from captured bundle response bodies, not from an
official schema:

- `TripItemTypes-CeicT-Cc.js` maps type code `A` to response property
  `AirObject` and maps the frontend `flight` slug back to type `A`. It also
  registers the Air routes listed below.
- `index-C6qCNcMY.js` defines a frontend `FlightObject` class whose serializer
  is `Nl`. `Nl` serializes/deserializes `Segment` through the `FlightSegment`
  serializer and `Traveler` through the traveler serializer. The common
  reservation serializer maps the common booking fields above.
- The common serializer converts wire strings `"true"` and `"false"` to
  Booleans, converts fields declared as `Number` (including status
  `last_modified`) numerically, and leaves fields declared as `String` as
  strings. A direct JSON consumer should not silently assume the frontend's
  converted types are the wire types.
- The frontend flight model chooses operating airline/code/flight number when
  all relevant operating values exist; otherwise it uses marketing values.
  This is consistent with the capture, where operating fields appeared on
  only four legs. The UI translation describes the resulting display as the
  plane/crew by the operating carrier “as” the marketing carrier.
- The model computes an AirObject's overall start/end by taking the earliest
  departure and latest arrival across its segments. This is frontend behavior;
  the wire object has no separate overall `StartDateTime` or `EndDateTime`.
- The English bundle labels the segment fields as Flight Number, Departure,
  Arrival, Terminal, Gate, Aircraft, Fare Class, Meal, Entertainment, Stops,
  Distance, On Time %, Seats, Duration, Layover, Baggage Claim, and Check-in.
  Those labels show intended UI presentation, not validation rules.

## Endpoint and route clues

### Endpoints

The trip-level GET above is the only Air-containing HTTP request observed in
the HAR. The shared `index-C6qCNcMY.js` bundle also contains these
frontend-declared endpoint patterns:

| Pattern | Evidence/status |
| --- | --- |
| `GET /api/v2/get/trip/uuid/{trip_uuid}/include_objects/true` with query parameters | **Network-observed**. The captured request used `exclude_types=weather` and `should_get_new_seat_tracker_subscriptions=true`. |
| `GET /api/v2/get/air/uuid/{reservation_uuid}` | **Frontend-observed only.** A generic `v2/get/{type}/uuid/{uuid}` helper combined with the type map `A → air`; this exact Air request was not made in the HAR. |
| `GET /api/v2/flightInfo?departure_date=...&airline_code=...&flight_num=...` | **Frontend-observed only.** A flight-route lookup helper; it is not a trip-object read and was not requested in the HAR. |
| `POST /api/v2/replacePlan/air/uuid/{reservation_uuid}` | **Frontend-observed only.** Generic reservation-update helper; no Air write was captured. |
| `POST /api/v2/delete/air/uuid/{reservation_uuid}` and `POST /api/v2/delete/segment/uuid/{segment_uuid}` | **Frontend-observed only.** Delete helpers; no mutating request was captured. |

The bundle's trip-fetch helper supplies `exclude_types=weather` by default and
sets `should_get_new_seat_tracker_subscriptions=true` for the
`include_objects/true` form. That explains the query values in the observed
request, but does not establish that those are the only accepted parameters.

### Browser routes

`TripItemTypes-CeicT-Cc.js` declares these SPA routes for the flight object:

```text
/trips/{tripUuid}/flights/create
/trips/{tripUuid}/flights/{segmentUuid}
/trips/{tripUuid}/flights/{segmentUuid}/edit
/unfiled/flight/{reservationUuid}
/unfiled/flight/{reservationUuid}/edit
```

The route names in the bundle are `segment_flight_create`, `segment_flight`,
`segment_flight_edit`, `unfiled_segment_flight`, and
`unfiled_segment_flight_edit`. These are frontend SPA routes, not evidence of
corresponding HTTP endpoints. The Air view/edit chunks were named in the
bundle's dynamic-import map, but they were not fetched by the active
car-rental page in this HAR.

## Sanitized representative wire example

This is a synthetic one-segment example that preserves the observed casing,
nesting, and scalar types. Values such as IDs, names, booking references,
traveler data, and URLs are placeholders; none are copied from the HAR. The
real response can contain multiple segments and may omit conditional fields.

```json
{
  "AirObject": [
    {
      "id": "<synthetic-id>",
      "uuid": "<synthetic-reservation-uuid>",
      "trip_id": "<synthetic-trip-id>",
      "trip_uuid": "<synthetic-trip-uuid>",
      "is_client_traveler": "true",
      "relative_url": "/reservation/show/uuid/<synthetic-reservation-uuid>",
      "display_name": "Example Air itinerary",
      "is_display_name_auto_generated": "false",
      "last_modified": "<synthetic-epoch-string>",
      "booking_date": "2099-01-01",
      "booking_site_conf_num": "<redacted-string>",
      "booking_site_name": "Example Air",
      "booking_site_phone": "<redacted>",
      "booking_site_url": "https://example.invalid/booking",
      "supplier_conf_num": "<redacted-string>",
      "is_purchased": "true",
      "total_cost": "CUR 0.00",
      "is_tripit_booking": "false",
      "has_possible_cancellation": "false",
      "is_concur_booked": "false",
      "Segment": [
        {
          "Status": {
            "flight_status": "200",
            "last_modified": "<synthetic-epoch-string>"
          },
          "StartDateTime": {
            "date": "2099-01-02",
            "time": "10:00:00",
            "timezone": "Etc/UTC",
            "utc_offset": "+00:00",
            "is_timezone_manual": "false"
          },
          "EndDateTime": {
            "date": "2099-01-02",
            "time": "12:00:00",
            "timezone": "Etc/UTC",
            "utc_offset": "+00:00",
            "is_timezone_manual": "false"
          },
          "start_airport_code": "AAA",
          "start_airport_name": "Origin Example Airport",
          "start_airport_latitude": "0.000000",
          "start_airport_longitude": "0.000000",
          "start_city_name": "Origin City",
          "start_country_code": "ZZ",
          "end_airport_code": "BBB",
          "end_airport_name": "Destination Example Airport",
          "end_airport_latitude": "0.000000",
          "end_airport_longitude": "0.000000",
          "end_city_name": "Destination City",
          "end_country_code": "ZZ",
          "marketing_airline": "Example Air",
          "marketing_airline_code": "EX",
          "marketing_flight_number": "0001",
          "operating_airline": "Example Regional",
          "operating_airline_code": "ER",
          "operating_flight_number": "0001",
          "aircraft": "E00",
          "aircraft_display_name": "Example Aircraft",
          "distance": "0 mi",
          "duration": "2h, 00m",
          "service_class": "Example Economy (Y)",
          "stops": "nonstop",
          "refund_info_url": "https://example.invalid/refund",
          "change_reservation_url": "https://example.invalid/change",
          "mobile_change_reservation_url": "https://example.invalid/mobile-change",
          "customer_support_url": "https://example.invalid/support",
          "mobile_customer_support_url": "https://example.invalid/mobile-support",
          "general_fees_url": "https://example.invalid/fees",
          "web_home_url": "https://example.invalid/",
          "mobile_home_url": "https://example.invalid/mobile",
          "is_eligible_seattracker": "false",
          "is_eligible_airhelp": "false",
          "is_hidden": "false",
          "id": "<synthetic-segment-id>",
          "uuid": "<synthetic-segment-uuid>",
          "is_international": "false",
          "does_cross_idl": "false",
          "Emissions": {
            "co2": "0.00000"
          }
        }
      ],
      "Traveler": {
        "first_name": "<synthetic-name>",
        "middle_name": "<synthetic-name>",
        "last_name": "<synthetic-name>",
        "frequent_traveler_num": "<redacted>",
        "frequent_traveler_supplier": "Example Rewards",
        "ticket_num": "<redacted>"
      }
    }
  ]
}
```

## Coverage and uncertainties

Covered here are all 22 direct keys observed under `AirObject`, all 43 keys
observed under `Segment`, both observed `Status` keys, all five observed
date/time keys, `Emissions.co2`, all six observed traveler keys, the
frontend's additional declared-but-unseen fields, the `A`/`AirObject`/`flight`
registry mapping, status-code labels, endpoint helpers, and flight SPA route
clues.

The capture cannot establish:

- whether AirObject, Segment, or Traveler cardinalities differ for other
  accounts, trips, imports, or unfiled plans;
- whether absent keys are omitted, nullable, gated by Pro/account state, or
  returned only for particular carriers or booking sources;
- accepted values, validation, authentication requirements, or write payloads
  for any endpoint;
- units or scope for `Emissions.co2`, units/normalization for coordinates,
  distance, duration, or timestamps;
- whether the singleton `Traveler` wire shape is always used for one traveler
  or is merely the result of this particular response serializer;
- whether raw-only fields such as `id`, `trip_id`, coordinates, carrier links,
  `does_cross_idl`, and `is_concur_booked` are intentionally supported API
  fields or legacy/extra response data.
