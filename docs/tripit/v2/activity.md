# TripIt v2 `ActivityObject`

## Scope and evidence

This page documents the Activity frontend model and registry entries visible in
the captured [`www.tripit.com.har`](./www.tripit.com.har). It is reverse-engineered
documentation for an undocumented surface, not an official TripIt API contract.

The captured trip-read response does **not** contain an `ActivityObject` property,
and no Activity detail request was made. Consequently, the model and field maps
below are **frontend-observed** only. They do not establish a wire payload, server
requiredness, nullability, accepted values, or mutation behavior. No Activity JSON
example is included because doing so would invent an unobserved wire shape.

Evidence labels:

- **Payload-observed:** occurs in the captured response body. There are no such
  Activity fields in this capture.
- **Frontend-observed:** appears in a JavaScript response captured by the HAR.
- **Inferred:** an interpretation from a field name or method; it is not proof of
  a server-side meaning or write contract.

The relevant captured assets are `ActivityObject-BGf0RlZP.js` (model classes),
`index-C6qCNcMY.js` (serializers and generic API helpers),
`TripItemTypes-CeicT-Cc.js` (registry and SPA routes),
`Address-Hl9pc1FK.js` (common reservation/address classes), and
`BaseSegment-DQFXsffw.js` (segment base class).

## Registry and response placement

The frontend registry declares:

| Type code | Response property | Frontend slug | Payload in this HAR |
| --- | --- | --- | --- |
| `Y` | `ActivityObject` | `activity` | Not present |

The one successful trip-read response has root keys `AirObject`, `CarObject`,
`LodgingObject`, `Profile`, `Trip`, `timestamp`, and `num_bytes`; it has no
`ActivityObject`, `RestaurantObject`, or `NoteObject` key. The active page in the
capture was a car-rental page, so the absence is expected for this sample and is
not evidence that Activity plans are unsupported.

## Frontend `ActivityObject` model

The following are all fields declared directly by the `ActivityObject` class in
`ActivityObject-BGf0RlZP.js`, plus the serializer key where
`index-C6qCNcMY.js` declares one. “Default” is the JavaScript model’s initial
value, not an API default.

| Model field | Frontend type/default | Serializer key | Frontend-observed behavior |
| --- | --- | --- | --- |
| `startDateTime` | `DateTime` or `null` | `StartDateTime` | Start date/time value. |
| `endDateTime` | `DateTime` or `null` | `EndDateTime` | End date/time value. The custom serializer forces `is_timezone_manual` to `"false"` when serializing an end time. |
| `address` | `Address` or `null` | `Address` | `getDisplayAddress()` returns the nested address model’s `displayAddress`. |
| `locationName` | string or `null` | `location_name` | Activity location name. |
| `travelers` | array, default `[]` | `Participant` wrapper | The serializer writes `{Participant: [...]}` when non-empty and deserializes the wrapper into an array. |
| `segments` | array, default `[]` | `Segment` via generic helper | Client segment collection. The serializer uses `deserializeSegments`; no Activity payload was present to show its wire cardinality. |
| `activityType` | string or `null` | `detail_type_code` | Activity subtype code; see the enum below. |
| `reservationType` | constant `Y` | none | Internal reservation-family discriminator, not a declared JSON field. |

`ActivityObject.assertDefault()` creates an `ActivitySegment` when the collection
is empty, creates default date/time and address models, and asserts a display name.
These are client construction behaviors, not server guarantees. The class also
provides `getMinutes()`, `getDisplayMinutes()`, `getDisplayAddress()`,
`isMeeting()`, `isTour()`, `isConcert()`, and `isTheater()` helpers.

### Activity subtype enum

The frontend declares exactly four activity subtype names and codes in
`ActivityObject-BGf0RlZP.js`:

| UI/subtype name | `detail_type_code` | Predicate in the model |
| --- | --- | --- |
| `meeting` | `M` | `isMeeting()` |
| `theater` | `H` | `isTheater()` |
| `tour` | `T` | `isTour()` |
| `concert` | `C` | `isConcert()` |

These are frontend-observed values. The HAR contains no Activity payload from
which to verify that the API uses the same codes, whether the field is required,
or whether other codes are accepted.

## Activity segment model

`ActivitySegment` extends the shared `BaseSegment` class. The model fields are:

| Model field | Frontend type/default | Serializer behavior | Evidence/meaning |
| --- | --- | --- | --- |
| `uuid` | string or `null` | Reads the segment `uuid`; segment key is derived from it | **Frontend-observed:** segment identity. |
| `reservationUuid` | string or `null` | Client-side reservation link; the generic segment serializer treats it as read-only | **Frontend-observed:** links a segment to its reservation. Exact wire representation is not established without a payload. |
| `segmentType` | constant `Y` | none | **Frontend-observed:** Activity segment-family discriminator, not a declared JSON field. |

The Activity serializer’s `segments` mapping invokes the generic segment
deserializer, which can read a `Segment` member (or a directly supplied object)
and attach the reservation UUID. Neither form was observed for Activity here.

## Inherited reservation fields

`ActivityObject` extends the common reservation model. The fields below are
therefore part of the frontend object even though no Activity instance was
deserialized in this HAR. The “wire key” is the key declared by the shared
serializer, not a claim that it was returned or accepted for Activity.

### Common identity and metadata

| Model field | Frontend type/default | Wire key declared by serializer | Notes |
| --- | --- | --- | --- |
| `uuid` | string or `null` | `uuid` | Reservation UUID. |
| `tripUuid` | string or `null` | `trip_uuid` | Parent trip UUID. |
| `isClientTraveler` | Boolean, default `false` | `is_client_traveler` | Boolean serializer accepts string boolean forms. |
| `relativeUrl` | string or `null` | `relative_url` | Relative reservation path. |
| `displayName` | string or `null` | `display_name` | Display title. |
| `image` | value or `null` | none identified | Legacy/internal model property; no direct mapping was identified in the inspected common map. |
| `creator` | string or `null` | `Creator` | Read-only creator marker in the common map. |
| `isDisplayNameAutoGenerated` | Boolean, default `false` | `is_display_name_auto_generated` | Auto-generated-title flag. |
| `lastModified` | date/time value or `null` | `last_modified` | Custom deserializer converts `Number(last_modified)` before date handling; timestamp units are not stated. |
| `documents` | array, default `[]` | `Image` object/array | Common document/image collection; neither an Activity payload nor an `Image` member was captured. |

### Booking and supplier fields

| Model field | Frontend type/default | Wire key declared by serializer | Meaning suggested by field name |
| --- | --- | --- | --- |
| `cancellationDateTime` | date/time or `null` | `CancellationDateTime` | Cancellation timestamp. |
| `bookingDate` | string or `null` | `booking_date` | Booking date. |
| `bookingRate` | string or `null` | `booking_rate` | Free-form booking/rate text. |
| `bookingSiteConfirmationNumber` | string or `null` | `booking_site_conf_num` | Booking-site confirmation/reference. Sensitive in real responses. |
| `bookingSiteName` | string or `null` | `booking_site_name` | Booking-site name. |
| `bookingSitePhone` | string or `null` | `booking_site_phone` | Booking-site phone. Sensitive in real responses. |
| `bookingSiteEmailAddress` | string or `null` | `booking_site_email_address` | Booking-site email. Sensitive in real responses. |
| `bookingSiteUrl` | string or `null` | `booking_site_url` | Booking-site URL; opaque query strings may be sensitive. |
| `recordLocator` | string or `null` | `record_locator` | Read-only record locator. |
| `supplierConfirmationNumber` | string or `null` | `supplier_conf_num` | Supplier confirmation/reference. Sensitive in real responses. |
| `supplierContact` | string or `null` | `supplier_contact` | Free-form supplier contact. |
| `supplierEmailAddress` | string or `null` | `supplier_email_address` | Supplier email. Sensitive in real responses. |
| `supplierName` | string or `null` | `supplier_name` | Supplier name. |
| `supplierPhone` | string or `null` | `supplier_phone` | Supplier phone. Sensitive in real responses. |
| `supplierUrl` | string or `null` | `supplier_url` | Supplier URL. |
| `isPurchased` | Boolean, default `false` | `is_purchased` | Purchase/booking state. |
| `notes` | string or `null` | `notes` | Free-form notes. |
| `restrictions` | string or `null` | `restrictions` | Restrictions text. |
| `totalCost` | string or `null` | `total_cost` | Formatted cost text; numeric grammar is not declared. |
| `isTripitBooking` | Boolean, default `false` | `is_tripit_booking` | Read-only TripIt-booking flag. |
| `hasPossibleCancellation` | Boolean, default `false` | `has_possible_cancellation` | Read-only cancellation flag. |
| `agency` | `Agency` object, default new `Agency` | `Agency` | Travel-agency details; nested fields are below. |

`is_concur_booked`, `id`, and `trip_id` occur in some other captured object
families but are not declared by the inspected common reservation map. There is
no Activity payload here from which to determine whether Activity responses carry
those extra keys.

### `Agency` model

The inherited `agency` property is an `Agency` object. Its six frontend fields
and shared serializer keys are:

| Model field | Type/default | Wire key |
| --- | --- | --- |
| `confirmationNumber` | string or `null` | `agency_conf_num` |
| `name` | string or `null` | `agency_name` |
| `phone` | string or `null` | `agency_phone` |
| `emailAddress` | string or `null` | `agency_email_address` |
| `url` | string or `null` | `agency_url` |
| `contact` | string or `null` | `agency_contact` |

No Agency value was captured for Activity. Contact values should be handled as
sensitive.

## Nested frontend models

These nested fields are defined by shared serializers used by Activity. They are
included to make the frontend model complete; none is payload-observed for
Activity in this HAR.

### `DateTime`

| Model field | Frontend type/default | Wire key |
| --- | --- | --- |
| `date` | string or `null` | `date` |
| `time` | string or `null` | `time` |
| `isTimeKnown` | derived Boolean | none; true when `time` is non-empty |
| `timezone` | string or `null` | `timezone` |
| `isTimezoneKnown` | derived Boolean | none; true when `timezone` is non-empty |
| `isTimezoneManual` | Boolean | `is_timezone_manual` |
| `utcOffset` | string or `null` | `utc_offset` |
| `preferredTimezone` | string or `null` | `preferred_timezone` |

### `Address`

| Model field | Frontend type/default | Wire key |
| --- | --- | --- |
| `displayAddress` | string or `null` | `address` |
| `addr1` | string or `null` | `addr1` |
| `addr2` | string or `null` | `addr2` |
| `city` | string or `null` | `city` |
| `state` | string or `null` | `state` |
| `zip` | string or `null` | `zip` |
| `country` | string or `null` | `country` |
| `latitude` | string or `null` | `latitude` |
| `longitude` | string or `null` | `longitude` |

### `Traveler` entries

Activity’s serializer uses the `Participant` wrapper for these entries. The
traveler model fields are:

| Model field | Frontend type/default | Wire key |
| --- | --- | --- |
| `firstName` | string or `null` | `first_name` |
| `middleName` | string or `null` | `middle_name` |
| `lastName` | string or `null` | `last_name` |
| `frequentTravelerNumber` | string or `null` | `frequent_traveler_num` |
| `frequentTravelerSupplier` | string or `null` | `frequent_traveler_supplier` |
| `mealPreference` | string or `null` | `meal_preference` |
| `seatPreference` | string or `null` | `seat_preference` |
| `ticketNumber` | string or `null` | `ticket_num` |

Names, loyalty numbers, and ticket numbers are personal data. No Participant
entry was present in an Activity payload because no Activity payload was present.

## SPA routes and API-helper clues

`TripItemTypes-CeicT-Cc.js` declares the following **browser SPA routes**. They
are not themselves API endpoints:

| SPA path | Route name |
| --- | --- |
| `/trips/:tripUuid/activity/create` | `segment_activity_create` |
| `/trips/:tripUuid/activity/:segmentUuid` | `segment_activity` |
| `/unfiled/activity/:reservationUuid` | `unfiled_segment_activity` |
| `/trips/:tripUuid/activity/:segmentUuid/edit` | `segment_activity_edit` |
| `/unfiled/activity/:reservationUuid/edit` | `unfiled_segment_activity_edit` |

`index-C6qCNcMY.js` maps the Activity type code to the `activity` slug in its
generic API helpers. The helper equivalent to
`GET v2/get/{type}/uuid/{uuid}` therefore has an Activity form equivalent to
`GET /api/v2/get/activity/uuid/{uuid}` under the API base used by the captured
trip/profile requests. This is **bundle evidence only**: no such request occurs
in the HAR. The same bundle defines generic create, replace-plan, and delete
helpers, but no Activity mutation request was captured.

## Coverage and unknowns

- **Frontend-covered:** registry code/name/slug, all fields declared by the
  Activity class and its inherited reservation/agency/segment/nested models,
  the four subtype codes, exact SPA route family, and generic helper mapping.
- **Payload-covered:** no Activity fields, objects, arrays, cardinality, or
  examples. The captured response has no `ActivityObject` root key.
- **Unknown:** server-side field names and types for Activity, wrapper shape and
  cardinality for `Participant` and `Segment`, requiredness/nullability, accepted
  subtype codes, object IDs, date/amount formats, query parameters, and all write
  semantics.

A future capture of an Activity detail or edit page, including its network calls,
is required before treating this frontend model as a v2 wire schema.
