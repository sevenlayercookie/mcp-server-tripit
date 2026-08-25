import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import * as z from "zod/v4";
import { withTripIt } from "../client";
import { normalizedToolOutputSchema, toolResult } from "../results";
import { toolAnnotations } from "./common";

export function registerActivityTools(server: McpServer): void {
  server.registerTool(
    "tripit_get_activity",
    {
      title: "Get a TripIt activity",
      description: "Use this to inspect an activity by numeric ID or UUID before updating or deleting it.",
      inputSchema: {
        id: z.string().min(1).describe("Activity ID or UUID."),
      },
      outputSchema: normalizedToolOutputSchema,
      annotations: toolAnnotations("read"),
    },
    async ({ id }) =>
      toolResult("tripit_get_activity", async () =>
        (await withTripIt((client) => client.getActivity(id))) as Record<string, unknown>,
      ),
  );

  server.registerTool(
    "tripit_create_activity",
    {
      title: "Create a TripIt activity",
      description: "Create a structured activity directly in a specified TripIt trip.",
      inputSchema: {
        trip: z.string().min(1).describe("Trip UUID or Trip ID."),
        name: z.string().min(1).describe("Activity name."),
        startDate: z.string().min(1).describe("Start date in YYYY-MM-DD format."),
        startTime: z.string().min(1).describe("Start time in HH:MM format."),
        endDate: z.string().min(1).describe("End date in YYYY-MM-DD format."),
        endTime: z.string().min(1).describe("End time in HH:MM format."),
        timezone: z.string().min(1).describe("Timezone."),
        address: z.string().min(1).describe("Street address."),
        locationName: z.string().min(1).describe("Location or venue name."),
        city: z.string().optional().describe("City."),
        state: z.string().optional().describe("State or province."),
        zip: z.string().optional().describe("Postal code."),
        country: z.string().optional().describe("Country code."),
      },
      outputSchema: normalizedToolOutputSchema,
      annotations: toolAnnotations("create"),
    },
    async (args) =>
      toolResult("tripit_create_activity", async () =>
        (await withTripIt((client) =>
          client.createActivity({
            tripId: args.trip,
            displayName: args.name,
            startDate: args.startDate,
            startTime: args.startTime,
            endDate: args.endDate,
            endTime: args.endTime,
            timezone: args.timezone,
            address: args.address,
            locationName: args.locationName,
            city: args.city,
            state: args.state,
            zip: args.zip,
            country: args.country,
          }),
        )) as Record<string, unknown>,
      ),
  );

  server.registerTool(
    "tripit_update_activity",
    {
      title: "Update a TripIt activity",
      description: "Update an activity after confirming its identifier and current fields with tripit_get_activity.",
      inputSchema: {
        id: z.string().min(1).describe("Activity ID or UUID."),
        trip: z.string().optional().describe("Trip UUID or Trip ID."),
        name: z.string().optional().describe("Activity name."),
        startDate: z.string().optional().describe("Start date in YYYY-MM-DD format."),
        startTime: z.string().optional().describe("Start time in HH:MM format."),
        endDate: z.string().optional().describe("End date in YYYY-MM-DD format."),
        endTime: z.string().optional().describe("End time in HH:MM format."),
        timezone: z.string().optional().describe("Timezone."),
        address: z.string().optional().describe("Street address."),
        locationName: z.string().optional().describe("Location or venue name."),
        city: z.string().optional().describe("City."),
        state: z.string().optional().describe("State or province."),
        zip: z.string().optional().describe("Postal code."),
        country: z.string().optional().describe("Country code."),
        notes: z.string().optional().describe("Activity notes."),
      },
      outputSchema: normalizedToolOutputSchema,
      annotations: toolAnnotations("update"),
    },
    async (args) =>
      toolResult("tripit_update_activity", async () =>
        (await withTripIt((client) =>
          client.updateActivity({
            id: args.id,
            tripId: args.trip,
            displayName: args.name,
            startDate: args.startDate,
            startTime: args.startTime,
            endDate: args.endDate,
            endTime: args.endTime,
            timezone: args.timezone,
            address: args.address,
            locationName: args.locationName,
            city: args.city,
            state: args.state,
            zip: args.zip,
            country: args.country,
            notes: args.notes,
          }),
        )) as Record<string, unknown>,
      ),
  );

  server.registerTool(
    "tripit_delete_activity",
    {
      title: "Delete a TripIt activity",
      description: "Permanently delete an activity after confirming it with tripit_get_activity.",
      inputSchema: {
        id: z.string().min(1).describe("Activity ID or UUID."),
      },
      outputSchema: normalizedToolOutputSchema,
      annotations: toolAnnotations("delete"),
    },
    async ({ id }) =>
      toolResult("tripit_delete_activity", async () =>
        (await withTripIt((client) => client.deleteActivity(id))) as Record<string, unknown>,
      ),
  );
}
