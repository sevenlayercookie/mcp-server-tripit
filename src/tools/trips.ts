import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import * as z from "zod/v4";
import { withTripIt } from "../client";
import { normalizedToolOutputSchema, toolResult } from "../results";
import { toolAnnotations } from "./common";

export function registerTripTools(server: McpServer): void {
  server.registerTool(
    "tripit_list_trips",
    {
      title: "List TripIt trips",
      description: "Use this to find trips in the authenticated TripIt account before reading or changing one.",
      inputSchema: {
        pageSize: z.number().int().positive().optional().describe("Number of trips to return. Defaults to 100."),
        pageNum: z.number().int().positive().optional().describe("Page number to fetch. Defaults to 1."),
        past: z.boolean().optional().describe("When true, list past trips instead of current/future trips."),
      },
      outputSchema: normalizedToolOutputSchema,
      annotations: toolAnnotations("read"),
    },
    async ({ pageSize, pageNum, past }) =>
      toolResult("tripit_list_trips", async () =>
        (await withTripIt((client) => client.listTrips(pageSize ?? 100, pageNum ?? 1, past ?? false))) as Record<string, unknown>,
      ),
  );

  server.registerTool(
    "tripit_get_trip",
    {
      title: "Get a TripIt trip",
      description: "Use this to inspect one trip by its TripIt numeric ID or UUID before updating or deleting it.",
      inputSchema: {
        id: z.string().min(1).describe("Trip ID or UUID."),
      },
      outputSchema: normalizedToolOutputSchema,
      annotations: toolAnnotations("read"),
    },
    async ({ id }) =>
      toolResult("tripit_get_trip", async () =>
        (await withTripIt((client) => client.getTrip(id))) as Record<string, unknown>,
      ),
  );

  server.registerTool(
    "tripit_create_trip",
    {
      title: "Create a TripIt trip",
      description: "Create a new trip in the authenticated TripIt account.",
      inputSchema: {
        name: z.string().min(1).describe("Trip display name."),
        start: z.string().optional().describe("Start date in YYYY-MM-DD format. Defaults to today."),
        end: z.string().optional().describe("End date in YYYY-MM-DD format. Defaults to start date or today."),
        location: z.string().optional().describe("Primary location for the trip."),
      },
      outputSchema: normalizedToolOutputSchema,
      annotations: toolAnnotations("create"),
    },
    async ({ name, start, end, location }) => {
      const today = new Date().toISOString().slice(0, 10);
      return toolResult("tripit_create_trip", async () =>
        (await withTripIt((client) =>
          client.createTrip({
            displayName: name,
            startDate: start ?? today,
            endDate: end ?? start ?? today,
            primaryLocation: location,
          }),
        )) as Record<string, unknown>);
    },
  );

  server.registerTool(
    "tripit_update_trip",
    {
      title: "Update a TripIt trip",
      description: "Update an existing trip after confirming its identifier and current details with tripit_get_trip.",
      inputSchema: {
        id: z.string().min(1).describe("Trip ID or UUID."),
        name: z.string().optional().describe("New trip display name."),
        start: z.string().optional().describe("Updated start date in YYYY-MM-DD format."),
        end: z.string().optional().describe("Updated end date in YYYY-MM-DD format."),
        location: z.string().optional().describe("Updated primary location."),
        description: z.string().optional().describe("Trip description."),
      },
      outputSchema: normalizedToolOutputSchema,
      annotations: toolAnnotations("update"),
    },
    async ({ id, name, start, end, location, description }) =>
      toolResult("tripit_update_trip", async () =>
        (await withTripIt((client) =>
          client.updateTrip({
            id,
            displayName: name,
            startDate: start,
            endDate: end,
            primaryLocation: location,
            description,
          }),
        )) as Record<string, unknown>,
      ),
  );

  server.registerTool(
    "tripit_delete_trip",
    {
      title: "Delete a TripIt trip",
      description: "Permanently delete a trip by numeric ID or UUID after confirming it with tripit_get_trip.",
      inputSchema: {
        id: z.string().min(1).describe("Trip ID or UUID."),
      },
      outputSchema: normalizedToolOutputSchema,
      annotations: toolAnnotations("delete"),
    },
    async ({ id }) =>
      toolResult("tripit_delete_trip", async () =>
        (await withTripIt((client) => client.deleteTrip(id))) as Record<string, unknown>,
      ),
  );
}
