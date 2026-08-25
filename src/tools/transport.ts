import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import * as z from "zod/v4";
import { withTripIt } from "../client";
import { normalizedToolOutputSchema, toolResult } from "../results";
import { toolAnnotations } from "./common";

export function registerTransportTools(server: McpServer): void {
  server.registerTool(
    "tripit_get_transport",
    {
      title: "Get TripIt transport",
      description: "Use this to inspect a transport item by numeric ID or UUID before updating or deleting it.",
      inputSchema: {
        id: z.string().min(1).describe("Transport ID or UUID."),
      },
      outputSchema: normalizedToolOutputSchema,
      annotations: toolAnnotations("read"),
    },
    async ({ id }) =>
      toolResult("tripit_get_transport", async () =>
        (await withTripIt((client) => client.getTransport(id))) as Record<string, unknown>,
      ),
  );

  server.registerTool(
    "tripit_create_transport",
    {
      title: "Create TripIt transport",
      description: "Create a structured transport segment directly in a specified TripIt trip.",
      inputSchema: {
        trip: z.string().min(1).describe("Trip UUID or Trip ID."),
        from: z.string().min(1).describe("Start address."),
        to: z.string().min(1).describe("End address."),
        departDate: z.string().min(1).describe("Departure date in YYYY-MM-DD format."),
        departTime: z.string().min(1).describe("Departure time in HH:MM format."),
        arriveDate: z.string().min(1).describe("Arrival date in YYYY-MM-DD format."),
        arriveTime: z.string().min(1).describe("Arrival time in HH:MM format."),
        timezone: z.string().min(1).describe("Timezone."),
        fromName: z.string().optional().describe("Start location name."),
        toName: z.string().optional().describe("End location name."),
        name: z.string().optional().describe("Display name."),
        vehicle: z.string().optional().describe("Vehicle description."),
        carrier: z.string().optional().describe("Carrier name."),
        confirmation: z.string().optional().describe("Confirmation number."),
      },
      outputSchema: normalizedToolOutputSchema,
      annotations: toolAnnotations("create"),
    },
    async (args) =>
      toolResult("tripit_create_transport", async () =>
        (await withTripIt((client) =>
          client.createTransport({
            tripId: args.trip,
            startAddress: args.from,
            endAddress: args.to,
            startDate: args.departDate,
            startTime: args.departTime,
            endDate: args.arriveDate,
            endTime: args.arriveTime,
            timezone: args.timezone,
            startLocationName: args.fromName,
            endLocationName: args.toName,
            displayName: args.name,
            vehicleDescription: args.vehicle,
            carrierName: args.carrier,
            confirmationNum: args.confirmation,
          }),
        )) as Record<string, unknown>,
      ),
  );

  server.registerTool(
    "tripit_update_transport",
    {
      title: "Update TripIt transport",
      description: "Update a transport item after confirming its identifier and current fields with tripit_get_transport.",
      inputSchema: {
        id: z.string().min(1).describe("Transport ID or UUID."),
        trip: z.string().optional().describe("Trip UUID or Trip ID."),
        from: z.string().optional().describe("Start address."),
        to: z.string().optional().describe("End address."),
        departDate: z.string().optional().describe("Departure date in YYYY-MM-DD format."),
        departTime: z.string().optional().describe("Departure time in HH:MM format."),
        arriveDate: z.string().optional().describe("Arrival date in YYYY-MM-DD format."),
        arriveTime: z.string().optional().describe("Arrival time in HH:MM format."),
        timezone: z.string().optional().describe("Timezone."),
        fromName: z.string().optional().describe("Start location name."),
        toName: z.string().optional().describe("End location name."),
        name: z.string().optional().describe("Display name."),
        vehicle: z.string().optional().describe("Vehicle description."),
        carrier: z.string().optional().describe("Carrier name."),
        confirmation: z.string().optional().describe("Confirmation number."),
      },
      outputSchema: normalizedToolOutputSchema,
      annotations: toolAnnotations("update"),
    },
    async (args) =>
      toolResult("tripit_update_transport", async () =>
        (await withTripIt((client) =>
          client.updateTransport({
            id: args.id,
            tripId: args.trip,
            startAddress: args.from,
            endAddress: args.to,
            startDate: args.departDate,
            startTime: args.departTime,
            endDate: args.arriveDate,
            endTime: args.arriveTime,
            timezone: args.timezone,
            startLocationName: args.fromName,
            endLocationName: args.toName,
            displayName: args.name,
            vehicleDescription: args.vehicle,
            carrierName: args.carrier,
            confirmationNum: args.confirmation,
          }),
        )) as Record<string, unknown>,
      ),
  );

  server.registerTool(
    "tripit_delete_transport",
    {
      title: "Delete TripIt transport",
      description: "Permanently delete a transport item after confirming it with tripit_get_transport.",
      inputSchema: {
        id: z.string().min(1).describe("Transport ID or UUID."),
      },
      outputSchema: normalizedToolOutputSchema,
      annotations: toolAnnotations("delete"),
    },
    async ({ id }) =>
      toolResult("tripit_delete_transport", async () =>
        (await withTripIt((client) => client.deleteTransport(id))) as Record<string, unknown>,
      ),
  );
}
