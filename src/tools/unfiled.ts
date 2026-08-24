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
        "Move an unfiled travel item into an existing trip using a complete writable replacement object. Weather objects cannot be assigned.",
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
