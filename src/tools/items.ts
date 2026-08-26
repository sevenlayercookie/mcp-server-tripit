import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import * as z from "zod/v4";
import { withTripIt } from "../client";
import { normalizedToolOutputSchema, toolResult } from "../results";
import { toolAnnotations } from "./common";
import {
  createTripItem,
  getTripItem,
  objectTypeSchema,
  writableItemSchema,
} from "./unfiled";

export function registerItemTools(server: McpServer): void {
  server.registerTool(
    "tripit_get_trip_item",
    {
      title: "Get a TripIt trip item",
      description:
        "Read one v1/v2 plan object by its type and numeric ID or UUID. Supports air, activity, car, cruise, parking, directions, lodging, map, note, rail, restaurant, transport, and weather objects.",
      inputSchema: {
        type: objectTypeSchema.describe("TripIt plan-object type."),
        id: z.string().min(1).describe("TripIt object ID or UUID."),
      },
      outputSchema: normalizedToolOutputSchema,
      annotations: toolAnnotations("read"),
    },
    async ({ type, id }) =>
      toolResult("tripit_get_trip_item", async () =>
        withTripIt((client) => getTripItem(client, type, id)),
      ),
  );

  server.registerTool(
    "tripit_create_trip_item",
    {
      title: "Create a TripIt trip item",
      description:
        "Create one typed itinerary item directly in an existing trip. Use tripit_list_trips or tripit_get_trip first to obtain the destination ID or UUID. Supports every writable TripIt item type. For cars, preserve airport/location and vehicle details with item.pickupLocation, item.dropoffLocation, and item.vehicle.",
      inputSchema: {
        trip: z.string().min(1).describe("Destination TripIt numeric trip ID or UUID."),
        item: writableItemSchema.describe(
          "Typed air, activity, car, parking, cruise, directions, lodging, map, note, rail, restaurant, or transport item.",
        ),
      },
      outputSchema: normalizedToolOutputSchema,
      annotations: toolAnnotations("create"),
    },
    async ({ trip, item }) =>
      toolResult("tripit_create_trip_item", async () =>
        withTripIt((client) => createTripItem(client, trip, item)),
      ),
  );
}
