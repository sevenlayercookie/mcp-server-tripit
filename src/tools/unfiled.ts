import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import * as z from "zod/v4";
import { tripItApiGet, tripItApiPost, withTripIt, type TripItClient } from "../client";
import { jsonResult } from "../results";

const objectTypes = [
  "air",
  "activity",
  "car",
  "cruise",
  "parking",
  "directions",
  "lodging",
  "map",
  "note",
  "rail",
  "restaurant",
  "transport",
  "weather",
] as const;

const objectTypeSchema = z.enum(objectTypes);
type TripItObjectType = (typeof objectTypes)[number];
type AssignableTripItObjectType = Exclude<TripItObjectType, "weather">;

const assignableObjectTypeSchema = objectTypeSchema.exclude(["weather"]);

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).describe("Date in YYYY-MM-DD format.");
const timeSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/)
  .describe("Local time in HH:MM or HH:MM:SS format.");

const personSchema = z.object({
  firstName: z.string().optional().describe("First name."),
  middleName: z.string().optional().describe("Middle name."),
  lastName: z.string().optional().describe("Last name."),
  frequentTravelerNumber: z.string().optional().describe("Frequent-traveler number."),
  frequentTravelerSupplier: z.string().optional().describe("Frequent-traveler program or supplier."),
  mealPreference: z.string().optional().describe("Meal preference."),
  seatPreference: z.string().optional().describe("Seat preference."),
  ticketNumber: z.string().optional().describe("Ticket number."),
});

const agencySchema = z.object({
  confirmation: z.string().optional().describe("Agency confirmation number."),
  name: z.string().optional().describe("Agency name."),
  clientName: z.string().optional().describe("Agency client name."),
  phone: z.string().optional().describe("Agency phone."),
  email: z.string().optional().describe("Agency email."),
  url: z.string().optional().describe("Agency URL."),
  contact: z.string().optional().describe("Agency contact."),
});

const reservationDetailsShape = {
  bookingDate: dateSchema.optional().describe("Date the reservation was booked."),
  confirmation: z.string().optional().describe("Supplier confirmation or reservation number."),
  bookingConfirmation: z.string().optional().describe("Booking-site confirmation number."),
  supplierName: z.string().optional().describe("Supplier name when different from the display name."),
  supplierPhone: z.string().optional().describe("Supplier phone number."),
  supplierEmail: z.string().optional().describe("Supplier email address."),
  supplierUrl: z.string().optional().describe("Supplier URL."),
  bookingSiteName: z.string().optional().describe("Booking site or agency name."),
  bookingSitePhone: z.string().optional().describe("Booking site phone."),
  bookingSiteEmail: z.string().optional().describe("Booking site email."),
  bookingSiteUrl: z.string().optional().describe("Booking site URL."),
  bookingRate: z.string().optional().describe("Rate description."),
  recordLocator: z.string().optional().describe("Reservation record locator."),
  supplierContact: z.string().optional().describe("Supplier contact name."),
  cost: z.string().optional().describe("Total cost, including currency when known."),
  notes: z.string().optional().describe("Useful reservation details not represented by another field."),
  restrictions: z.string().optional().describe("Cancellation or booking restrictions."),
  purchased: z.boolean().optional().describe("Whether the reservation was purchased."),
  agency: agencySchema.optional().describe("Travel agency details."),
};

const addressShape = {
  address: z.string().min(1).describe("Full street or venue address."),
  city: z.string().optional().describe("City."),
  state: z.string().optional().describe("State or province."),
  zip: z.string().optional().describe("Postal code."),
  country: z.string().optional().describe("ISO country code such as US or CA."),
};

const optionalAddressShape = {
  address: z.string().optional().describe("Full street or venue address."),
  city: z.string().optional().describe("City."),
  state: z.string().optional().describe("State or province."),
  zip: z.string().optional().describe("Postal code."),
  country: z.string().optional().describe("ISO country code such as US or CA."),
};

const conversionTargetSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("lodging"),
    name: z.string().min(1).describe("Property, campground, or lodging name."),
    checkin: dateSchema.describe("Check-in date."),
    checkout: dateSchema.describe("Check-out date."),
    checkinTime: timeSchema.optional().describe("Check-in time. Defaults to 15:00."),
    checkoutTime: timeSchema.optional().describe("Check-out time. Defaults to 11:00."),
    timezone: z.string().min(1).describe("IANA timezone such as America/Edmonton."),
    ...addressShape,
    ...reservationDetailsShape,
    guests: z.array(personSchema).optional().describe("Named guests."),
    numberGuests: z.number().int().positive().optional().describe("Number of guests."),
    numberRooms: z.number().int().positive().optional().describe("Number of rooms or sites."),
    roomType: z.string().optional().describe("Room, unit, or campsite type."),
  }),
  z.object({
    type: z.literal("activity"),
    name: z.string().min(1).describe("Activity title."),
    startDate: dateSchema.optional().describe("Start date, when known."),
    startTime: timeSchema.optional().describe("Start time, when known."),
    endDate: dateSchema.optional().describe("End date, when known."),
    endTime: timeSchema.optional().describe("End time, when known."),
    timezone: z.string().optional().describe("IANA timezone such as America/Denver."),
    locationName: z.string().optional().describe("Venue or activity location name."),
    ...optionalAddressShape,
    ...reservationDetailsShape,
    participants: z.array(personSchema).optional().describe("Named participants."),
  }),
  z.object({
    type: z.literal("car"),
    name: z.string().min(1).describe("Car reservation title."),
    pickupDate: dateSchema.describe("Pickup date."),
    pickupTime: timeSchema.describe("Pickup time."),
    pickupTimezone: z.string().min(1).describe("Pickup IANA timezone."),
    dropoffDate: dateSchema.describe("Drop-off date."),
    dropoffTime: timeSchema.describe("Drop-off time."),
    dropoffTimezone: z.string().min(1).describe("Drop-off IANA timezone."),
    pickupAddress: z.string().optional().describe("Pickup address."),
    pickupCity: z.string().optional().describe("Pickup city."),
    pickupState: z.string().optional().describe("Pickup state or province."),
    pickupZip: z.string().optional().describe("Pickup postal code."),
    pickupCountry: z.string().optional().describe("Pickup country code."),
    pickupName: z.string().optional().describe("Pickup location name."),
    pickupHours: z.string().optional().describe("Pickup location hours."),
    pickupPhone: z.string().optional().describe("Pickup location phone."),
    dropoffAddress: z.string().optional().describe("Drop-off address."),
    dropoffCity: z.string().optional().describe("Drop-off city."),
    dropoffState: z.string().optional().describe("Drop-off state or province."),
    dropoffZip: z.string().optional().describe("Drop-off postal code."),
    dropoffCountry: z.string().optional().describe("Drop-off country code."),
    dropoffName: z.string().optional().describe("Drop-off location name."),
    dropoffHours: z.string().optional().describe("Drop-off location hours."),
    dropoffPhone: z.string().optional().describe("Drop-off location phone."),
    reservationHolder: personSchema.optional().describe("Reservation holder."),
    drivers: z.array(personSchema).optional().describe("Named drivers."),
    carDescription: z.string().optional().describe("Vehicle description."),
    carType: z.string().optional().describe("Vehicle class or type."),
    mileageCharges: z.string().optional().describe("Mileage allowance or charges."),
    ...reservationDetailsShape,
  }),
  z.object({
    type: z.literal("parking"),
    name: z.string().min(1).describe("Parking reservation title."),
    startDate: dateSchema.describe("Parking start date."),
    startTime: timeSchema.describe("Parking start time."),
    endDate: dateSchema.describe("Parking end date."),
    endTime: timeSchema.describe("Parking end time."),
    timezone: z.string().min(1).describe("IANA timezone."),
    ...addressShape,
    locationName: z.string().optional().describe("Parking facility name."),
    locationHours: z.string().optional().describe("Facility hours."),
    locationPhone: z.string().optional().describe("Facility phone."),
    valetTicket: z.string().optional().describe("Valet ticket number."),
    ...reservationDetailsShape,
  }),
  z.object({
    type: z.literal("cruise"),
    name: z.string().min(1).describe("Cruise reservation title."),
    shipName: z.string().optional().describe("Ship name."),
    cabinNumber: z.string().optional().describe("Cabin number."),
    cabinType: z.string().optional().describe("Cabin category or type."),
    dining: z.string().optional().describe("Dining assignment."),
    travelers: z.array(personSchema).optional().describe("Named travelers."),
    segments: z
      .array(
        z.object({
          startDate: dateSchema.describe("Segment start date."),
          startTime: timeSchema.optional().describe("Segment start time."),
          endDate: dateSchema.describe("Segment end date."),
          endTime: timeSchema.optional().describe("Segment end time."),
          timezone: z.string().optional().describe("Segment IANA timezone."),
          locationName: z.string().optional().describe("Port or segment location name."),
          address: z.string().optional().describe("Port address."),
          city: z.string().optional().describe("Port city."),
          state: z.string().optional().describe("Port state or province."),
          zip: z.string().optional().describe("Port postal code."),
          country: z.string().optional().describe("Port country code."),
          portOfCall: z.boolean().optional().describe("Whether this segment is a port of call."),
        }),
      )
      .min(1)
      .describe("One or more cruise segments."),
    ...reservationDetailsShape,
  }),
  z.object({
    type: z.literal("directions"),
    name: z.string().min(1).describe("Directions title."),
    date: dateSchema.optional().describe("Directions date."),
    time: timeSchema.optional().describe("Directions time."),
    timezone: z.string().optional().describe("IANA timezone."),
    from: z.string().min(1).describe("Starting address."),
    fromCity: z.string().optional().describe("Starting city."),
    fromState: z.string().optional().describe("Starting state or province."),
    fromZip: z.string().optional().describe("Starting postal code."),
    fromCountry: z.string().optional().describe("Starting country code."),
    to: z.string().min(1).describe("Destination address."),
    toCity: z.string().optional().describe("Destination city."),
    toState: z.string().optional().describe("Destination state or province."),
    toZip: z.string().optional().describe("Destination postal code."),
    toCountry: z.string().optional().describe("Destination country code."),
    mode: z.enum(["bicycling", "driving", "transit", "walking"]).optional().describe("Travel mode."),
  }),
  z.object({
    type: z.literal("map"),
    name: z.string().min(1).describe("Map title."),
    date: dateSchema.optional().describe("Map date."),
    time: timeSchema.optional().describe("Map time."),
    timezone: z.string().optional().describe("IANA timezone."),
    ...addressShape,
  }),
  z.object({
    type: z.literal("note"),
    name: z.string().min(1).describe("Note title."),
    date: dateSchema.optional().describe("Note date."),
    time: timeSchema.optional().describe("Note time."),
    timezone: z.string().optional().describe("IANA timezone."),
    ...optionalAddressShape,
    source: z.string().optional().describe("Note source."),
    text: z.string().optional().describe("Primary note text."),
    url: z.string().optional().describe("Related URL."),
    notes: z.string().optional().describe("Additional notes."),
    article: z.boolean().optional().describe("Mark the note as an article."),
  }),
  z.object({
    type: z.literal("rail"),
    name: z.string().min(1).describe("Rail reservation title."),
    travelers: z.array(personSchema).optional().describe("Named travelers."),
    segments: z
      .array(
        z.object({
          departDate: dateSchema.describe("Departure date."),
          departTime: timeSchema.describe("Departure time."),
          departTimezone: z.string().min(1).describe("Departure IANA timezone."),
          arriveDate: dateSchema.describe("Arrival date."),
          arriveTime: timeSchema.describe("Arrival time."),
          arriveTimezone: z.string().min(1).describe("Arrival IANA timezone."),
          from: z.string().min(1).describe("Departure station name."),
          fromAddress: z.string().optional().describe("Departure station address."),
          to: z.string().min(1).describe("Arrival station name."),
          toAddress: z.string().optional().describe("Arrival station address."),
          carrier: z.string().optional().describe("Rail carrier."),
          coach: z.string().optional().describe("Coach number."),
          confirmation: z.string().optional().describe("Segment confirmation number."),
          seats: z.string().optional().describe("Seat assignment."),
          serviceClass: z.string().optional().describe("Service class."),
          trainNumber: z.string().optional().describe("Train number."),
          trainType: z.string().optional().describe("Train type or service name."),
        }),
      )
      .min(1)
      .describe("One or more rail segments."),
    ...reservationDetailsShape,
  }),
  z.object({
    type: z.literal("restaurant"),
    name: z.string().min(1).describe("Restaurant name."),
    date: dateSchema.describe("Reservation date."),
    time: timeSchema.describe("Reservation time."),
    timezone: z.string().min(1).describe("IANA timezone."),
    ...addressShape,
    reservationHolder: personSchema.optional().describe("Reservation holder."),
    attendees: z.array(personSchema).optional().describe("Named attendees."),
    cuisine: z.string().optional().describe("Cuisine."),
    dressCode: z.string().optional().describe("Dress code."),
    hours: z.string().optional().describe("Restaurant hours."),
    numberPatrons: z.number().int().positive().optional().describe("Party size."),
    priceRange: z.string().optional().describe("Price range."),
    ...reservationDetailsShape,
  }),
  z.object({
    type: z.literal("air"),
    name: z.string().min(1).describe("Flight reservation title."),
    airline: z.string().min(1).describe("Airline or supplier name."),
    confirmation: z.string().optional().describe("Airline confirmation number."),
    cost: z.string().optional().describe("Total cost, including currency when known."),
    notes: z.string().optional().describe("Flight notes."),
    purchased: z.boolean().optional().describe("Whether the flight was purchased."),
    travelers: z.array(personSchema).optional().describe("Named travelers."),
    segments: z
      .array(
        z.object({
          departDate: dateSchema.describe("Departure date."),
          departTime: timeSchema.describe("Departure time."),
          departTimezone: z.string().min(1).describe("Departure IANA timezone."),
          arriveDate: dateSchema.describe("Arrival date."),
          arriveTime: timeSchema.describe("Arrival time."),
          arriveTimezone: z.string().min(1).describe("Arrival IANA timezone."),
          from: z.string().min(1).describe("Departure city."),
          fromCountry: z.string().optional().describe("Departure country code."),
          fromAirport: z.string().optional().describe("Departure airport code."),
          to: z.string().min(1).describe("Arrival city."),
          toCountry: z.string().optional().describe("Arrival country code."),
          toAirport: z.string().optional().describe("Arrival airport code."),
          airlineCode: z.string().min(1).describe("Marketing airline code."),
          flightNumber: z.string().min(1).describe("Marketing flight number."),
          aircraft: z.string().optional().describe("Aircraft type."),
          serviceClass: z.string().optional().describe("Service class."),
          seats: z.string().optional().describe("Seat assignment."),
        }),
      )
      .min(1)
      .describe("One or more flight segments."),
  }),
  z.object({
    type: z.literal("transport"),
    name: z.string().min(1).describe("Transport title."),
    from: z.string().min(1).describe("Start address."),
    fromName: z.string().optional().describe("Start location name."),
    to: z.string().min(1).describe("End address."),
    toName: z.string().optional().describe("End location name."),
    departDate: dateSchema.describe("Departure date."),
    departTime: timeSchema.describe("Departure time."),
    arriveDate: dateSchema.describe("Arrival date."),
    arriveTime: timeSchema.describe("Arrival time."),
    timezone: z.string().min(1).describe("IANA timezone."),
    carrier: z.string().optional().describe("Carrier name."),
    confirmation: z.string().optional().describe("Confirmation number."),
    vehicle: z.string().optional().describe("Vehicle description."),
  }),
]);

type ConversionTarget = z.infer<typeof conversionTargetSchema>;
type SourceDisposition = "keep_unfiled" | "delete" | "assign_to_trip";

const responseKeys: Record<TripItObjectType, string> = {
  air: "AirObject",
  activity: "ActivityObject",
  car: "CarObject",
  cruise: "CruiseObject",
  parking: "ParkingObject",
  directions: "DirectionsObject",
  lodging: "LodgingObject",
  map: "MapObject",
  note: "NoteObject",
  rail: "RailObject",
  restaurant: "RestaurantObject",
  transport: "TransportObject",
  weather: "WeatherObject",
};

function apiEndpoint(version: "v1" | "v2", path: string): string {
  return `https://api.tripit.com/${version}/${path}/format/json`;
}

function isUuid(id: string): boolean {
  return id.includes("-");
}

function identifierEndpoint(
  action: "get" | "replace" | "delete",
  type: TripItObjectType | "trip",
  id: string,
): string {
  return isUuid(id)
    ? apiEndpoint("v2", `${action}/${type}/uuid/${encodeURIComponent(id)}`)
    : apiEndpoint("v1", `${action}/${type}/id/${encodeURIComponent(id)}`);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isUnfiled(item: Record<string, unknown>): boolean {
  return !item.trip_id && !item.trip_uuid;
}

function responseItem(response: Record<string, unknown>, type: TripItObjectType): Record<string, unknown> {
  return namedResponseItem(response, responseKeys[type]);
}

function namedResponseItem(response: Record<string, unknown>, key: string): Record<string, unknown> {
  const value = response[key];
  const item = Array.isArray(value) ? value.find(isRecord) : value;

  if (!isRecord(item)) {
    throw new Error(`TripIt did not return a ${key} object.`);
  }

  return item;
}

function namedResponseItems(response: Record<string, unknown>, key: string): Record<string, unknown>[] {
  const value = response[key];
  return (Array.isArray(value) ? value : [value]).filter(isRecord);
}

function assertUnfiled(response: Record<string, unknown>, type: TripItObjectType, id: string): void {
  if (!isUnfiled(responseItem(response, type))) {
    throw new Error(`${type} item ${id} belongs to a trip and is not an unfiled item.`);
  }
}

function assertNoTrip(data: Record<string, unknown>): void {
  if (data.trip_id || data.trip_uuid) {
    throw new Error("Unfiled item data must not include trip_id or trip_uuid.");
  }
}

const baseObjectFields = ["display_name", "Image"] as const;

const reservationFields = [
  "CancelUserAction",
  "CancellationDateTime",
  "booking_date",
  "booking_rate",
  "booking_site_conf_num",
  "booking_site_name",
  "booking_site_phone",
  "booking_site_email_address",
  "booking_site_url",
  "record_locator",
  "supplier_conf_num",
  "supplier_contact",
  "supplier_email_address",
  "supplier_name",
  "supplier_phone",
  "supplier_url",
  "is_purchased",
  "notes",
  "restrictions",
  "total_cost",
  "Agency",
] as const;

const typeFields: Record<AssignableTripItObjectType, readonly string[]> = {
  air: ["Segment", "Traveler"],
  activity: ["StartDateTime", "EndDateTime", "end_time", "Address", "Participant", "detail_type_code", "location_name"],
  car: [
    "EstimatedStartDateTime",
    "EstimatedEndDateTime",
    "StartDateTime",
    "EndDateTime",
    "StartLocationAddress",
    "EndLocationAddress",
    "ReservationHolder",
    "Driver",
    "start_location_hours",
    "start_location_name",
    "start_location_phone",
    "end_location_hours",
    "end_location_name",
    "end_location_phone",
    "car_description",
    "car_type",
    "mileage_charges",
  ],
  cruise: ["Segment", "Traveler", "cabin_number", "cabin_type", "dining", "ship_name"],
  parking: [
    "StartDateTime",
    "EndDateTime",
    "Address",
    "location_hours",
    "location_name",
    "valet_ticket_num",
    "location_phone",
  ],
  directions: ["DateTime", "StartAddress", "EndAddress", "detail_type_code"],
  lodging: [
    "EstimatedStartDateTime",
    "EstimatedEndDateTime",
    "StartDateTime",
    "EndDateTime",
    "Address",
    "Guest",
    "number_guests",
    "number_rooms",
    "room_type",
    "bic_code",
  ],
  map: ["DateTime", "Address"],
  note: ["DateTime", "Address", "detail_type_code", "source", "text", "url", "notes"],
  rail: ["Segment", "Traveler"],
  restaurant: [
    "DateTime",
    "Address",
    "ReservationHolder",
    "Attendee",
    "cuisine",
    "dress_code",
    "hours",
    "number_patrons",
    "price_range",
  ],
  transport: ["Segment", "Traveler"],
};

const reservationTypes = new Set<AssignableTripItObjectType>([
  "air",
  "activity",
  "car",
  "cruise",
  "parking",
  "lodging",
  "rail",
  "restaurant",
  "transport",
]);

const dateTimeFields = ["date", "time", "timezone", "is_timezone_manual", "preferred_timezone"] as const;
const addressFields = ["address", "addr1", "addr2", "city", "state", "zip", "country"] as const;
const travelerFields = [
  "first_name",
  "middle_name",
  "last_name",
  "frequent_traveler_num",
  "frequent_traveler_supplier",
  "meal_preference",
  "seat_preference",
  "ticket_num",
] as const;
const imageFields = ["caption", "url", "ImageData"] as const;
const imageDataFields = ["content", "mime_type"] as const;
const agencyFields = [
  "agency_conf_num",
  "agency_name",
  "agency_client_name",
  "agency_phone",
  "agency_email_address",
  "agency_url",
  "agency_contact",
] as const;
const cancelUserActionFields = ["action_code", "action_at", "action_by"] as const;

const segmentFields: Record<"air" | "cruise" | "rail" | "transport", readonly string[]> = {
  air: [
    "StartDateTime",
    "EndDateTime",
    "start_airport_code",
    "start_city_name",
    "start_country_code",
    "start_gate",
    "start_terminal",
    "end_airport_code",
    "end_city_name",
    "end_country_code",
    "end_gate",
    "end_terminal",
    "marketing_airline",
    "marketing_flight_number",
    "operating_airline",
    "operating_flight_number",
    "aircraft",
    "distance",
    "duration",
    "entertainment",
    "meal",
    "notes",
    "ontime_perc",
    "seats",
    "service_class",
    "stops",
    "baggage_claim",
    "check_in_url",
    "mobile_check_in_url",
    "refund_info_url",
    "mobile_refund_info_url",
    "change_reservation_url",
    "mobile_change_reservation_url",
    "customer_support_url",
    "mobile_customer_support_url",
    "general_fees_url",
    "web_home_url",
    "mobile_home_url",
  ],
  cruise: ["StartDateTime", "EndDateTime", "LocationAddress", "location_name", "detail_type_code"],
  rail: [
    "StartDateTime",
    "EndDateTime",
    "StartStationAddress",
    "EndStationAddress",
    "start_station_name",
    "end_station_name",
    "carrier_name",
    "coach_number",
    "confirmation_num",
    "seats",
    "service_class",
    "train_number",
    "train_type",
  ],
  transport: [
    "StartDateTime",
    "EndDateTime",
    "StartLocationAddress",
    "EndLocationAddress",
    "start_location_name",
    "end_location_name",
    "detail_type_code",
    "carrier_name",
    "confirmation_num",
    "number_passengers",
    "vehicle_description",
  ],
};

function copyFields(
  source: Record<string, unknown>,
  fields: readonly string[],
  transform: (key: string, value: unknown) => unknown = (_key, value) => value,
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const key of fields) {
    const value = source[key];
    if (value === undefined || value === null) continue;

    const transformed = transform(key, value);
    if (transformed !== undefined) result[key] = transformed;
  }

  return result;
}

function sanitizeRecord(value: unknown, fields: readonly string[]): Record<string, unknown> | undefined {
  return isRecord(value) ? copyFields(value, fields) : undefined;
}

function sanitizeRepeated(
  value: unknown,
  sanitizer: (item: Record<string, unknown>) => Record<string, unknown>,
): Record<string, unknown>[] | undefined {
  const values = Array.isArray(value) ? value : [value];
  const records = values.filter(isRecord).map(sanitizer);
  return records.length > 0 ? records : undefined;
}

function sanitizeNested(key: string, value: unknown, type: AssignableTripItObjectType): unknown {
  if (key.endsWith("DateTime") || key === "DateTime") return sanitizeRecord(value, dateTimeFields);
  if (key.includes("Address")) return sanitizeRecord(value, addressFields);
  if (key === "Agency") return sanitizeRecord(value, agencyFields);
  if (key === "CancelUserAction") return sanitizeRecord(value, cancelUserActionFields);
  if (key === "Image") {
    return sanitizeRepeated(value, (image) =>
      copyFields(image, imageFields, (imageKey, imageValue) =>
        imageKey === "ImageData" ? sanitizeRecord(imageValue, imageDataFields) : imageValue,
      ),
    );
  }
  if (["Traveler", "Guest", "Driver", "Attendee", "Participant"].includes(key)) {
    return sanitizeRepeated(value, (traveler) => copyFields(traveler, travelerFields));
  }
  if (key === "ReservationHolder") return sanitizeRecord(value, travelerFields);
  if (key === "Segment" && type in segmentFields) {
    const fields = segmentFields[type as keyof typeof segmentFields];
    return sanitizeRepeated(value, (segment) =>
      copyFields(segment, fields, (nestedKey, nestedValue) => sanitizeNested(nestedKey, nestedValue, type)),
    );
  }

  return isRecord(value) || Array.isArray(value) ? undefined : value;
}

type AssignmentTarget =
  | { version: "v1"; tripId: string }
  | { version: "v2"; objectUuid: string; tripUuid: string };

export function buildAssignmentItem(
  item: Record<string, unknown>,
  type: AssignableTripItObjectType,
  target: AssignmentTarget,
): Record<string, unknown> {
  // TripIt's object XSD uses a sequence. Build in schema order instead of cloning
  // the response, which also prevents response-only and undocumented fields from
  // being sent back to replace.
  const fields = [
    ...baseObjectFields,
    ...(reservationTypes.has(type) ? reservationFields : []),
    ...typeFields[type],
  ];
  const replacement: Record<string, unknown> = {};
  if (target.version === "v2") {
    replacement.uuid = target.objectUuid;
    replacement.trip_uuid = target.tripUuid;
  } else {
    replacement.trip_id = target.tripId;
  }
  Object.assign(replacement, copyFields(item, fields, (key, value) => sanitizeNested(key, value, type)));

  if (type in segmentFields && !replacement.Segment) {
    throw new Error(`TripIt did not return the complete ${type} segments required for assignment.`);
  }

  return replacement;
}

function numericId(value: unknown, description: string): string {
  const id = typeof value === "number" || typeof value === "string" ? String(value) : "";
  if (!/^[1-9]\d*$/.test(id)) {
    throw new Error(`TripIt did not return the numeric ${description} required for assignment.`);
  }

  return id;
}

function responseUuid(item: Record<string, unknown>, description: string): string {
  const uuid = typeof item.uuid === "string" ? item.uuid.trim() : "";
  if (!isUuid(uuid)) {
    throw new Error(`TripIt did not return the ${description} UUID required for a v2 assignment.`);
  }

  return uuid;
}

function responseNumericId(item: Record<string, unknown>, description: string): string {
  const directId = typeof item.id === "number" || typeof item.id === "string" ? String(item.id) : "";
  if (/^[1-9]\d*$/.test(directId)) return directId;

  // v2 responses identify objects by UUID, but their UI-relative URL retains
  // the numeric ID needed by v1 replace.
  const relativeUrl = typeof item.relative_url === "string" ? item.relative_url : "";
  const relativeId = relativeUrl.match(/\/id\/([1-9]\d*)(?:[/?#]|$)/)?.[1];
  return numericId(relativeId, description);
}

function sameString(left: unknown, right: unknown): boolean {
  return typeof left === "string" && typeof right === "string" && left === right;
}

function sameTripDetails(left: Record<string, unknown>, right: Record<string, unknown>): boolean {
  return (
    sameString(left.start_date, right.start_date) &&
    sameString(left.end_date, right.end_date) &&
    sameString(left.display_name, right.display_name) &&
    (left.primary_location === undefined ||
      right.primary_location === undefined ||
      sameString(left.primary_location, right.primary_location))
  );
}

async function listV1Trips(client: TripItClient): Promise<Record<string, unknown>[]> {
  const trips: Record<string, unknown>[] = [];

  for (const past of [false, true]) {
    let pageNum = 1;
    let maxPage = 1;

    do {
      const filters = ["traveler", "all"];
      if (past) filters.push("past", "true");
      const url = new URL(apiEndpoint("v1", `list/trip/${filters.join("/")}`));
      url.searchParams.set("page_size", "100");
      url.searchParams.set("page_num", String(pageNum));

      const response = await tripItApiGet<Record<string, unknown>>(client, url.toString());
      trips.push(...namedResponseItems(response, "Trip"));
      const parsedMaxPage = Number.parseInt(String(response.max_page ?? "1"), 10);
      maxPage = Number.isSafeInteger(parsedMaxPage) && parsedMaxPage > 0 ? parsedMaxPage : 1;
      pageNum += 1;
    } while (pageNum <= maxPage);
  }

  return trips;
}

export async function resolveV1TripId(
  client: TripItClient,
  tripUuid: string,
  v2Trip: Record<string, unknown>,
): Promise<string> {
  const trips = await listV1Trips(client);
  const uuidMatches = trips.filter((trip) => sameString(trip.uuid, tripUuid));
  const publicGuidMatches =
    typeof v2Trip.public_guid === "string"
      ? trips.filter((trip) => sameString(trip.public_guid, v2Trip.public_guid))
      : [];
  const detailMatches = trips.filter((trip) => sameTripDetails(trip, v2Trip));
  const matches = uuidMatches.length > 0 ? uuidMatches : publicGuidMatches.length > 0 ? publicGuidMatches : detailMatches;

  if (matches.length !== 1) {
    throw new Error(
      matches.length === 0
        ? `Could not resolve destination trip UUID ${tripUuid} to a v1 trip ID.`
        : `Destination trip UUID ${tripUuid} matched multiple v1 trips. Use a numeric trip ID instead.`,
    );
  }

  return responseNumericId(matches[0], "destination trip ID");
}

function filterUnfiled(response: Record<string, unknown>): Record<string, unknown> {
  const result = { ...response };
  let count = 0;

  for (const key of Object.values(responseKeys)) {
    const value = response[key];
    if (Array.isArray(value)) {
      const items = value.filter(isRecord).filter(isUnfiled);
      result[key] = items;
      count += items.length;
    } else if (isRecord(value)) {
      if (isUnfiled(value)) {
        count += 1;
      } else {
        delete result[key];
      }
    }
  }

  result.unfiled_items_on_page = count;
  return result;
}

export async function assignUnfiledItem(
  client: TripItClient,
  type: AssignableTripItObjectType,
  id: string,
  trip: string,
): Promise<Record<string, unknown>> {
  const initial = await tripItApiGet<Record<string, unknown>>(client, identifierEndpoint("get", type, id));
  const initialItem = responseItem(initial, type);

  if (!isUnfiled(initialItem)) {
    throw new Error(`${type} item ${id} belongs to a trip and is not an unfiled item.`);
  }

  const tripResponse = await tripItApiGet<Record<string, unknown>>(client, identifierEndpoint("get", "trip", trip));
  const tripItem = namedResponseItem(tripResponse, "Trip");

  // Keep the replace operation in the source item's API version. A numeric
  // unfiled ID must use v1 even when the destination was supplied as a UUID.
  const target: AssignmentTarget = isUuid(id)
    ? {
        version: "v2",
        objectUuid: id,
        tripUuid: isUuid(trip) ? trip : responseUuid(tripItem, "destination trip"),
      }
    : {
        version: "v1",
        tripId: isUuid(trip)
          ? await resolveV1TripId(client, trip, tripItem)
          : numericId(trip, "destination trip ID"),
      };
  const objectIdentifier = target.version === "v2" ? target.objectUuid : numericId(id, `${type} item ID`);

  // Replace is atomic: a successful response files the existing object in the
  // trip, while a failed response leaves the unfiled source untouched.
  return tripItApiPost<Record<string, unknown>>(client, identifierEndpoint("replace", type, objectIdentifier), {
    [responseKeys[type]]: buildAssignmentItem(initialItem, type, target),
  });
}

function compactRecord(values: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(values).filter(([, value]) => value !== undefined && value !== null));
}

function normalizedTime(value: string): string {
  return value.length === 5 ? `${value}:00` : value;
}

function conversionDateTime(date: string, time: string, timezone: string): Record<string, unknown> {
  return { date, time: normalizedTime(time), timezone };
}

function optionalConversionDateTime(
  date: string | undefined,
  time: string | undefined,
  timezone: string | undefined,
): Record<string, unknown> | undefined {
  if (!date && !time && !timezone) return undefined;
  return compactRecord({ date, time: time ? normalizedTime(time) : undefined, timezone });
}

function conversionAddress(target: {
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
}): Record<string, unknown> {
  return compactRecord({
    address: target.address,
    city: target.city,
    state: target.state,
    zip: target.zip,
    country: target.country,
  });
}

function conversionPeople(
  people:
    | Array<{
        firstName?: string;
        middleName?: string;
        lastName?: string;
        frequentTravelerNumber?: string;
        frequentTravelerSupplier?: string;
        mealPreference?: string;
        seatPreference?: string;
        ticketNumber?: string;
      }>
    | undefined,
) {
  return people?.map((person) =>
    compactRecord({
      first_name: person.firstName,
      middle_name: person.middleName,
      last_name: person.lastName,
      frequent_traveler_num: person.frequentTravelerNumber,
      frequent_traveler_supplier: person.frequentTravelerSupplier,
      meal_preference: person.mealPreference,
      seat_preference: person.seatPreference,
      ticket_num: person.ticketNumber,
    }),
  );
}

function conversionPerson(person: z.infer<typeof personSchema> | undefined) {
  return person ? conversionPeople([person])?.[0] : undefined;
}

function conversionAgency(agency: z.infer<typeof agencySchema> | undefined) {
  return agency
    ? compactRecord({
        agency_conf_num: agency.confirmation,
        agency_name: agency.name,
        agency_client_name: agency.clientName,
        agency_phone: agency.phone,
        agency_email_address: agency.email,
        agency_url: agency.url,
        agency_contact: agency.contact,
      })
    : undefined;
}

function conversionReservationFields(target: {
  bookingDate?: string;
  bookingRate?: string;
  bookingConfirmation?: string;
  bookingSiteName?: string;
  bookingSitePhone?: string;
  bookingSiteEmail?: string;
  bookingSiteUrl?: string;
  recordLocator?: string;
  confirmation?: string;
  supplierContact?: string;
  supplierName?: string;
  supplierPhone?: string;
  supplierEmail?: string;
  supplierUrl?: string;
  purchased?: boolean;
  notes?: string;
  restrictions?: string;
  cost?: string;
  agency?: z.infer<typeof agencySchema>;
}): Record<string, unknown> {
  // Keep this in TripIt's ReservationObject XSD sequence.
  return compactRecord({
    booking_date: target.bookingDate,
    booking_rate: target.bookingRate,
    booking_site_conf_num: target.bookingConfirmation,
    booking_site_name: target.bookingSiteName,
    booking_site_phone: target.bookingSitePhone,
    booking_site_email_address: target.bookingSiteEmail,
    booking_site_url: target.bookingSiteUrl,
    record_locator: target.recordLocator,
    supplier_conf_num: target.confirmation,
    supplier_contact: target.supplierContact,
    supplier_email_address: target.supplierEmail,
    supplier_name: target.supplierName,
    supplier_phone: target.supplierPhone,
    supplier_url: target.supplierUrl,
    is_purchased: target.purchased,
    notes: target.notes,
    restrictions: target.restrictions,
    total_cost: target.cost,
    Agency: conversionAgency(target.agency),
  });
}

export function buildConversionItem(target: ConversionTarget, trip: string): Record<string, unknown> {
  const association = isUuid(trip) ? { trip_uuid: trip } : { trip_id: numericId(trip, "destination trip ID") };

  if (target.type === "lodging") {
    return compactRecord({
      ...association,
      display_name: target.name,
      ...conversionReservationFields({ ...target, supplierName: target.supplierName ?? target.name }),
      StartDateTime: conversionDateTime(target.checkin, target.checkinTime ?? "15:00", target.timezone),
      EndDateTime: conversionDateTime(target.checkout, target.checkoutTime ?? "11:00", target.timezone),
      Address: conversionAddress(target),
      Guest: conversionPeople(target.guests),
      number_guests: target.numberGuests === undefined ? undefined : String(target.numberGuests),
      number_rooms: target.numberRooms === undefined ? undefined : String(target.numberRooms),
      room_type: target.roomType,
    });
  }

  if (target.type === "activity") {
    const address = conversionAddress(target);
    return compactRecord({
      ...association,
      display_name: target.name,
      ...conversionReservationFields(target),
      StartDateTime: optionalConversionDateTime(target.startDate, target.startTime, target.timezone),
      EndDateTime: optionalConversionDateTime(target.endDate, target.endTime, target.timezone),
      Address: Object.keys(address).length > 0 ? address : undefined,
      Participant: conversionPeople(target.participants),
      location_name: target.locationName,
    });
  }

  if (target.type === "car") {
    const pickupAddress = conversionAddress({
      address: target.pickupAddress,
      city: target.pickupCity,
      state: target.pickupState,
      zip: target.pickupZip,
      country: target.pickupCountry,
    });
    const dropoffAddress = conversionAddress({
      address: target.dropoffAddress,
      city: target.dropoffCity,
      state: target.dropoffState,
      zip: target.dropoffZip,
      country: target.dropoffCountry,
    });
    return compactRecord({
      ...association,
      display_name: target.name,
      ...conversionReservationFields(target),
      StartDateTime: conversionDateTime(target.pickupDate, target.pickupTime, target.pickupTimezone),
      EndDateTime: conversionDateTime(target.dropoffDate, target.dropoffTime, target.dropoffTimezone),
      StartLocationAddress: Object.keys(pickupAddress).length > 0 ? pickupAddress : undefined,
      EndLocationAddress: Object.keys(dropoffAddress).length > 0 ? dropoffAddress : undefined,
      ReservationHolder: conversionPerson(target.reservationHolder),
      Driver: conversionPeople(target.drivers),
      start_location_hours: target.pickupHours,
      start_location_name: target.pickupName,
      start_location_phone: target.pickupPhone,
      end_location_hours: target.dropoffHours,
      end_location_name: target.dropoffName,
      end_location_phone: target.dropoffPhone,
      car_description: target.carDescription,
      car_type: target.carType,
      mileage_charges: target.mileageCharges,
    });
  }

  if (target.type === "parking") {
    return compactRecord({
      ...association,
      display_name: target.name,
      ...conversionReservationFields({ ...target, supplierName: target.supplierName ?? target.name }),
      StartDateTime: conversionDateTime(target.startDate, target.startTime, target.timezone),
      EndDateTime: conversionDateTime(target.endDate, target.endTime, target.timezone),
      Address: conversionAddress(target),
      location_hours: target.locationHours,
      location_name: target.locationName,
      valet_ticket_num: target.valetTicket,
      location_phone: target.locationPhone,
    });
  }

  if (target.type === "cruise") {
    return compactRecord({
      ...association,
      display_name: target.name,
      ...conversionReservationFields(target),
      Segment: target.segments.map((segment) => {
        const locationAddress = conversionAddress(segment);
        return compactRecord({
          StartDateTime: optionalConversionDateTime(segment.startDate, segment.startTime, segment.timezone),
          EndDateTime: optionalConversionDateTime(segment.endDate, segment.endTime, segment.timezone),
          LocationAddress: Object.keys(locationAddress).length > 0 ? locationAddress : undefined,
          location_name: segment.locationName,
          detail_type_code: segment.portOfCall ? "P" : undefined,
        });
      }),
      Traveler: conversionPeople(target.travelers),
      cabin_number: target.cabinNumber,
      cabin_type: target.cabinType,
      dining: target.dining,
      ship_name: target.shipName,
    });
  }

  if (target.type === "directions") {
    const directionCodes = { bicycling: "B", driving: "D", transit: "T", walking: "W" } as const;
    return compactRecord({
      ...association,
      display_name: target.name,
      DateTime: optionalConversionDateTime(target.date, target.time, target.timezone),
      StartAddress: conversionAddress({
        address: target.from,
        city: target.fromCity,
        state: target.fromState,
        zip: target.fromZip,
        country: target.fromCountry,
      }),
      EndAddress: conversionAddress({
        address: target.to,
        city: target.toCity,
        state: target.toState,
        zip: target.toZip,
        country: target.toCountry,
      }),
      detail_type_code: target.mode ? directionCodes[target.mode] : undefined,
    });
  }

  if (target.type === "map") {
    return compactRecord({
      ...association,
      display_name: target.name,
      DateTime: optionalConversionDateTime(target.date, target.time, target.timezone),
      Address: conversionAddress(target),
    });
  }

  if (target.type === "note") {
    const address = conversionAddress(target);
    return compactRecord({
      ...association,
      display_name: target.name,
      DateTime: optionalConversionDateTime(target.date, target.time, target.timezone),
      Address: Object.keys(address).length > 0 ? address : undefined,
      detail_type_code: target.article ? "A" : undefined,
      source: target.source,
      text: target.text,
      url: target.url,
      notes: target.notes,
    });
  }

  if (target.type === "rail") {
    return compactRecord({
      ...association,
      display_name: target.name,
      ...conversionReservationFields(target),
      Segment: target.segments.map((segment) =>
        compactRecord({
          StartDateTime: conversionDateTime(segment.departDate, segment.departTime, segment.departTimezone),
          EndDateTime: conversionDateTime(segment.arriveDate, segment.arriveTime, segment.arriveTimezone),
          StartStationAddress: segment.fromAddress ? { address: segment.fromAddress } : undefined,
          EndStationAddress: segment.toAddress ? { address: segment.toAddress } : undefined,
          start_station_name: segment.from,
          end_station_name: segment.to,
          carrier_name: segment.carrier,
          coach_number: segment.coach,
          confirmation_num: segment.confirmation,
          seats: segment.seats,
          service_class: segment.serviceClass,
          train_number: segment.trainNumber,
          train_type: segment.trainType,
        }),
      ),
      Traveler: conversionPeople(target.travelers),
    });
  }

  if (target.type === "restaurant") {
    return compactRecord({
      ...association,
      display_name: target.name,
      ...conversionReservationFields({ ...target, supplierName: target.supplierName ?? target.name }),
      DateTime: conversionDateTime(target.date, target.time, target.timezone),
      Address: conversionAddress(target),
      ReservationHolder: conversionPerson(target.reservationHolder),
      Attendee: conversionPeople(target.attendees),
      cuisine: target.cuisine,
      dress_code: target.dressCode,
      hours: target.hours,
      number_patrons: target.numberPatrons === undefined ? undefined : String(target.numberPatrons),
      price_range: target.priceRange,
    });
  }

  if (target.type === "air") {
    return compactRecord({
      ...association,
      display_name: target.name,
      supplier_conf_num: target.confirmation,
      supplier_name: target.airline,
      is_purchased: target.purchased,
      notes: target.notes,
      total_cost: target.cost,
      Segment: target.segments.map((segment) =>
        compactRecord({
          StartDateTime: conversionDateTime(segment.departDate, segment.departTime, segment.departTimezone),
          EndDateTime: conversionDateTime(segment.arriveDate, segment.arriveTime, segment.arriveTimezone),
          start_airport_code: segment.fromAirport,
          start_city_name: segment.from,
          start_country_code: segment.fromCountry,
          end_airport_code: segment.toAirport,
          end_city_name: segment.to,
          end_country_code: segment.toCountry,
          marketing_airline: segment.airlineCode,
          marketing_flight_number: segment.flightNumber,
          aircraft: segment.aircraft,
          seats: segment.seats,
          service_class: segment.serviceClass,
        }),
      ),
      Traveler: conversionPeople(target.travelers),
    });
  }

  return compactRecord({
    ...association,
    display_name: target.name,
    Segment: [
      compactRecord({
        StartDateTime: conversionDateTime(target.departDate, target.departTime, target.timezone),
        EndDateTime: conversionDateTime(target.arriveDate, target.arriveTime, target.timezone),
        StartLocationAddress: { address: target.from },
        EndLocationAddress: { address: target.to },
        start_location_name: target.fromName,
        end_location_name: target.toName,
        confirmation_num: target.confirmation,
        carrier_name: target.carrier,
        vehicle_description: target.vehicle,
      }),
    ],
  });
}

function createdIdentifier(item: Record<string, unknown>, type: string): string {
  const uuid = typeof item.uuid === "string" ? item.uuid.trim() : "";
  if (uuid) return uuid;

  const id = typeof item.id === "string" || typeof item.id === "number" ? String(item.id) : "";
  if (id) return id;

  throw new Error(`TripIt created the ${type} object but did not return an ID or UUID for verification.`);
}

function assertCreatedInTrip(
  item: Record<string, unknown>,
  trip: string,
  destination: Record<string, unknown>,
): void {
  const expected = new Set(
    [trip, destination.id, destination.uuid]
      .filter((value): value is string | number => typeof value === "string" || typeof value === "number")
      .map(String),
  );
  const actual = [item.trip_id, item.trip_uuid]
    .filter((value): value is string | number => typeof value === "string" || typeof value === "number")
    .map(String);

  if (actual.length === 0 || !actual.some((identifier) => expected.has(identifier))) {
    throw new Error("TripIt created the structured object but did not associate it with the requested destination trip.");
  }
}

function errorText(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export async function convertUnfiledItem(
  client: TripItClient,
  sourceType: TripItObjectType,
  sourceId: string,
  trip: string,
  target: ConversionTarget,
  sourceDisposition: SourceDisposition,
): Promise<Record<string, unknown>> {
  if (sourceType === "weather" && sourceDisposition === "assign_to_trip") {
    throw new Error("Weather objects cannot be assigned to a trip; use keep_unfiled or delete.");
  }

  const sourceResponse = await tripItApiGet<Record<string, unknown>>(
    client,
    identifierEndpoint("get", sourceType, sourceId),
  );
  assertUnfiled(sourceResponse, sourceType, sourceId);

  const tripResponse = await tripItApiGet<Record<string, unknown>>(client, identifierEndpoint("get", "trip", trip));
  const destination = namedResponseItem(tripResponse, "Trip");
  const createTripId = isUuid(trip)
    ? await resolveV1TripId(client, trip, destination)
    : numericId(trip, "destination trip ID");
  const targetKey = responseKeys[target.type];
  const creation = await tripItApiPost<Record<string, unknown>>(client, apiEndpoint("v1", "create"), {
    [targetKey]: buildConversionItem(target, createTripId),
  });
  const created = namedResponseItem(creation, targetKey);
  const identifier = createdIdentifier(created, target.type);
  let verifiedItem: Record<string, unknown>;

  try {
    const verification = await tripItApiGet<Record<string, unknown>>(
      client,
      identifierEndpoint("get", target.type, identifier),
    );
    verifiedItem = responseItem(verification, target.type);
    assertCreatedInTrip(verifiedItem, trip, { ...destination, id: createTripId });
  } catch (error) {
    return {
      converted: true,
      partial_success: true,
      warning:
        "TripIt returned an ID for the new structured object, but destination verification failed. The original source was kept unfiled. Do not retry conversion without checking for a duplicate.",
      created: {
        type: target.type,
        id: created.id,
        uuid: created.uuid,
        object: created,
        verification_error: errorText(error),
      },
      source: {
        type: sourceType,
        id: sourceId,
        requested_disposition: sourceDisposition,
        status: "kept_unfiled",
      },
    };
  }

  const result: Record<string, unknown> = {
    converted: true,
    created: {
      type: target.type,
      id: verifiedItem.id,
      uuid: verifiedItem.uuid,
      trip_id: verifiedItem.trip_id,
      trip_uuid: verifiedItem.trip_uuid,
      object: verifiedItem,
    },
    source: {
      type: sourceType,
      id: sourceId,
      requested_disposition: sourceDisposition,
      status: "kept_unfiled",
    },
  };

  if (sourceDisposition === "keep_unfiled") return result;

  try {
    const dispositionResponse =
      sourceDisposition === "delete"
        ? await tripItApiGet<Record<string, unknown>>(client, identifierEndpoint("delete", sourceType, sourceId))
        : await assignUnfiledItem(client, sourceType as AssignableTripItObjectType, sourceId, trip);
    result.source = {
      type: sourceType,
      id: sourceId,
      requested_disposition: sourceDisposition,
      status: sourceDisposition === "delete" ? "deleted" : "assigned_to_trip",
      response: dispositionResponse,
    };
  } catch (error) {
    result.partial_success = true;
    result.warning =
      "The structured object was created and verified, but the original unfiled source could not be updated. Do not retry conversion without checking for a duplicate.";
    result.source = {
      type: sourceType,
      id: sourceId,
      requested_disposition: sourceDisposition,
      status: "disposition_failed",
      error: errorText(error),
    };
  }

  return result;
}

export function registerUnfiledTools(server: McpServer): void {
  server.registerTool(
    "tripit_unfiled_list",
    {
      title: "TripIt Unfiled Items List",
      description: "List unfiled travel items. Results are filtered to objects with no trip ID.",
      inputSchema: {
        type: objectTypeSchema.optional().describe("Optional TripIt object type filter."),
        pageSize: z.number().int().positive().optional().describe("Number of source objects to fetch. Defaults to 100."),
        pageNum: z.number().int().positive().optional().describe("Source page number to fetch. Defaults to 1."),
        past: z.boolean().optional().describe("When true, list past objects instead of current/future objects."),
      },
      annotations: {
        readOnlyHint: true,
        idempotentHint: true,
      },
    },
    async ({ type, pageSize, pageNum, past }) => {
      const filters = ["traveler", "false"];
      if (past) filters.push("past", "true");
      if (type) filters.push("type", type);

      const url = new URL(apiEndpoint("v1", `list/object/${filters.join("/")}`));
      url.searchParams.set("page_size", String(pageSize ?? 100));
      url.searchParams.set("page_num", String(pageNum ?? 1));

      return jsonResult(
        await withTripIt(async (client) => filterUnfiled(await tripItApiGet<Record<string, unknown>>(client, url.toString()))),
      );
    },
  );

  server.registerTool(
    "tripit_unfiled_get",
    {
      title: "TripIt Unfiled Items Get",
      description: "Get an unfiled travel item by object type and ID or UUID.",
      inputSchema: {
        type: objectTypeSchema.describe("TripIt object type."),
        id: z.string().min(1).describe("TripIt object ID or UUID."),
      },
      annotations: {
        readOnlyHint: true,
        idempotentHint: true,
      },
    },
    async ({ type, id }) =>
      jsonResult(
        await withTripIt(async (client) => {
          const response = await tripItApiGet<Record<string, unknown>>(client, identifierEndpoint("get", type, id));
          assertUnfiled(response, type, id);
          return response;
        }),
      ),
  );

  server.registerTool(
    "tripit_unfiled_create",
    {
      title: "TripIt Unfiled Items Create",
      description:
        "Create a travel item without a trip ID. TripIt may auto-file it when account auto-import is enabled and dates overlap a trip.",
      inputSchema: {
        type: objectTypeSchema.describe("TripIt object type."),
        data: z.record(z.string(), z.unknown()).describe("Fields for the TripIt API object, excluding trip_id and trip_uuid."),
      },
    },
    async ({ type, data }) => {
      assertNoTrip(data);
      return jsonResult(
        await withTripIt((client) =>
          tripItApiPost<Record<string, unknown>>(client, apiEndpoint("v2", `create/${type}`), {
            [responseKeys[type]]: data,
          }),
        ),
      );
    },
  );

  server.registerTool(
    "tripit_unfiled_update",
    {
      title: "TripIt Unfiled Items Update",
      description: "Replace an unfiled travel item. Data must contain the complete replacement object required by TripIt.",
      inputSchema: {
        type: objectTypeSchema.describe("TripIt object type."),
        id: z.string().min(1).describe("TripIt object ID or UUID."),
        data: z.record(z.string(), z.unknown()).describe("Complete replacement fields, excluding trip_id and trip_uuid."),
      },
      annotations: {
        idempotentHint: true,
      },
    },
    async ({ type, id, data }) => {
      assertNoTrip(data);
      return jsonResult(
        await withTripIt(async (client) => {
          const existing = await tripItApiGet<Record<string, unknown>>(client, identifierEndpoint("get", type, id));
          assertUnfiled(existing, type, id);
          return tripItApiPost<Record<string, unknown>>(client, identifierEndpoint("replace", type, id), {
            [responseKeys[type]]: data,
          });
        }),
      );
    },
  );

  server.registerTool(
    "tripit_unfiled_assign",
    {
      title: "TripIt Unfiled Items Assign",
      description:
        "File an unfiled travel item in a trip without changing its object type or parsing raw text. Use tripit_unfiled_convert to create a structured object from parsed details.",
      inputSchema: {
        type: assignableObjectTypeSchema.describe("TripIt object type."),
        id: z.string().min(1).describe("Unfiled TripIt object ID or UUID."),
        trip: z.string().min(1).describe("Destination TripIt trip ID or UUID."),
      },
      annotations: {
        idempotentHint: true,
      },
    },
    async ({ type, id, trip }) =>
      jsonResult(await withTripIt((client) => assignUnfiledItem(client, type, id, trip))),
  );

  server.registerTool(
    "tripit_unfiled_convert",
    {
      title: "TripIt Unfiled Items Convert",
      description:
        "Create any writable structured TripIt itinerary object from an unfiled item's parsed details. Supports air, activity, car, parking, cruise, directions, lodging, map, note, rail, restaurant, and transport. First read the source with tripit_unfiled_get, extract every supported field, then call this tool. Creation and destination verification complete before the original source is kept, deleted, or filed in the trip.",
      inputSchema: {
        sourceType: objectTypeSchema.describe("Object type of the original unfiled item."),
        sourceId: z.string().min(1).describe("ID or UUID of the original unfiled item."),
        trip: z.string().min(1).describe("Destination TripIt trip ID or UUID."),
        target: conversionTargetSchema.describe("Structured object type and parsed TripIt fields to create."),
        sourceDisposition: z
          .enum(["keep_unfiled", "delete", "assign_to_trip"])
          .describe(
            "What to do with the original only after successful conversion: keep it unfiled, delete it, or file the raw original in the destination trip.",
          ),
      },
      annotations: {
        destructiveHint: true,
      },
    },
    async ({ sourceType, sourceId, trip, target, sourceDisposition }) =>
      jsonResult(
        await withTripIt((client) =>
          convertUnfiledItem(client, sourceType, sourceId, trip, target, sourceDisposition),
        ),
      ),
  );

  server.registerTool(
    "tripit_unfiled_delete",
    {
      title: "TripIt Unfiled Items Delete",
      description: "Delete an unfiled travel item by object type and ID or UUID.",
      inputSchema: {
        type: objectTypeSchema.describe("TripIt object type."),
        id: z.string().min(1).describe("TripIt object ID or UUID."),
      },
      annotations: {
        destructiveHint: true,
      },
    },
    async ({ type, id }) =>
      jsonResult(
        await withTripIt(async (client) => {
          const existing = await tripItApiGet<Record<string, unknown>>(client, identifierEndpoint("get", type, id));
          assertUnfiled(existing, type, id);
          return tripItApiGet<Record<string, unknown>>(client, identifierEndpoint("delete", type, id));
        }),
      ),
  );
}
