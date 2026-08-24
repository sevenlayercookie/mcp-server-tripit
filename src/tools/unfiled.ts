import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import * as z from "zod/v4";
import { tripItApiGet, tripItApiPost, withTripIt } from "../client";
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

function identifierEndpoint(action: "get" | "replace" | "delete", type: TripItObjectType, id: string): string {
  return id.includes("-")
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
  const value = response[responseKeys[type]];
  const item = Array.isArray(value) ? value.find(isRecord) : value;

  if (!isRecord(item)) {
    throw new Error(`TripIt did not return a ${responseKeys[type]} object.`);
  }

  return item;
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

function assignToTrip(item: Record<string, unknown>, trip: string): Record<string, unknown> {
  const replacement = { ...item };

  for (const key of ["id", "uuid", "trip_id", "trip_uuid", "relative_url", "is_client_traveler", "is_traveler"]) {
    delete replacement[key];
  }

  if (trip.includes("-")) {
    replacement.trip_uuid = trip;
  } else {
    replacement.trip_id = trip;
  }

  return replacement;
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
      description: "Move an unfiled travel item into an existing trip while preserving its itinerary details.",
      inputSchema: {
        type: objectTypeSchema.describe("TripIt object type."),
        id: z.string().min(1).describe("Unfiled TripIt object ID or UUID."),
        trip: z.string().min(1).describe("Destination TripIt trip ID or UUID."),
      },
    },
    async ({ type, id, trip }) =>
      jsonResult(
        await withTripIt(async (client) => {
          const existing = await tripItApiGet<Record<string, unknown>>(client, identifierEndpoint("get", type, id));
          const item = responseItem(existing, type);

          if (!isUnfiled(item)) {
            throw new Error(`${type} item ${id} belongs to a trip and is not an unfiled item.`);
          }

          await client.getTrip(trip);

          return tripItApiPost<Record<string, unknown>>(client, identifierEndpoint("replace", type, id), {
            [responseKeys[type]]: assignToTrip(item, trip),
          });
        }),
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
