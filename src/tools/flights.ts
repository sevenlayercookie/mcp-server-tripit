import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import * as z from "zod/v4";
import { withTripIt } from "../client";
import { normalizedToolOutputSchema, toolResult } from "../results";
import { toolAnnotations } from "./common";

export function registerFlightTools(server: McpServer): void {
  server.registerTool(
    "tripit_get_flight",
    {
      title: "Get a TripIt flight",
      description: "Use this to inspect a flight by numeric ID or UUID before updating or deleting it.",
      inputSchema: {
        id: z.string().min(1).describe("Flight ID or UUID."),
      },
      outputSchema: normalizedToolOutputSchema,
      annotations: toolAnnotations("read"),
    },
    async ({ id }) =>
      toolResult("tripit_get_flight", async () =>
        (await withTripIt((client) => client.getFlight(id))) as Record<string, unknown>,
      ),
  );

  server.registerTool(
    "tripit_create_flight",
    {
      title: "Create a TripIt flight",
      description: "Create a structured flight directly in a specified TripIt trip.",
      inputSchema: {
        trip: z.string().min(1).describe("Trip UUID."),
        name: z.string().min(1).describe("Display name."),
        airline: z.string().min(1).describe("Airline name."),
        from: z.string().min(1).describe("Departure city."),
        fromCode: z.string().min(1).describe("Departure country code."),
        to: z.string().min(1).describe("Arrival city."),
        toCode: z.string().min(1).describe("Arrival country code."),
        airlineCode: z.string().min(1).describe("Airline code such as NH or JL."),
        flightNum: z.string().min(1).describe("Flight number."),
        departDate: z.string().min(1).describe("Departure date in YYYY-MM-DD format."),
        departTime: z.string().min(1).describe("Departure time in HH:MM format."),
        departTz: z.string().min(1).describe("Departure timezone."),
        arriveDate: z.string().min(1).describe("Arrival date in YYYY-MM-DD format."),
        arriveTime: z.string().min(1).describe("Arrival time in HH:MM format."),
        arriveTz: z.string().min(1).describe("Arrival timezone."),
        aircraft: z.string().optional().describe("Aircraft type."),
        serviceClass: z.string().optional().describe("Service class."),
        confirmation: z.string().optional().describe("Confirmation number."),
        notes: z.string().optional().describe("Flight notes."),
        cost: z.string().optional().describe("Total cost."),
      },
      outputSchema: normalizedToolOutputSchema,
      annotations: toolAnnotations("create"),
    },
    async (args) =>
      toolResult("tripit_create_flight", async () =>
        (await withTripIt((client) =>
          client.createFlight({
            tripId: args.trip,
            displayName: args.name,
            supplierName: args.airline,
            supplierConfNum: args.confirmation,
            notes: args.notes,
            totalCost: args.cost,
            segments: [
              {
                startDate: args.departDate,
                startTime: args.departTime,
                startTimezone: args.departTz,
                endDate: args.arriveDate,
                endTime: args.arriveTime,
                endTimezone: args.arriveTz,
                startCityName: args.from,
                startCountryCode: args.fromCode,
                endCityName: args.to,
                endCountryCode: args.toCode,
                marketingAirline: args.airlineCode,
                marketingFlightNumber: args.flightNum,
                aircraft: args.aircraft,
                serviceClass: args.serviceClass,
              },
            ],
          }),
        )) as Record<string, unknown>,
      ),
  );

  server.registerTool(
    "tripit_update_flight",
    {
      title: "Update a TripIt flight",
      description: "Update a flight after confirming its identifier and current fields with tripit_get_flight.",
      inputSchema: {
        id: z.string().min(1).describe("Flight ID or UUID."),
        trip: z.string().optional().describe("Trip UUID."),
        name: z.string().optional().describe("Display name."),
        airline: z.string().optional().describe("Airline name."),
        from: z.string().optional().describe("Departure city."),
        fromCode: z.string().optional().describe("Departure country code."),
        to: z.string().optional().describe("Arrival city."),
        toCode: z.string().optional().describe("Arrival country code."),
        airlineCode: z.string().optional().describe("Airline code such as NH or JL."),
        flightNum: z.string().optional().describe("Flight number."),
        departDate: z.string().optional().describe("Departure date in YYYY-MM-DD format."),
        departTime: z.string().optional().describe("Departure time in HH:MM format."),
        departTz: z.string().optional().describe("Departure timezone."),
        arriveDate: z.string().optional().describe("Arrival date in YYYY-MM-DD format."),
        arriveTime: z.string().optional().describe("Arrival time in HH:MM format."),
        arriveTz: z.string().optional().describe("Arrival timezone."),
        aircraft: z.string().optional().describe("Aircraft type."),
        serviceClass: z.string().optional().describe("Service class."),
        confirmation: z.string().optional().describe("Confirmation number."),
        notes: z.string().optional().describe("Flight notes."),
        cost: z.string().optional().describe("Total cost."),
      },
      outputSchema: normalizedToolOutputSchema,
      annotations: toolAnnotations("update"),
    },
    async (args) =>
      toolResult("tripit_update_flight", async () =>
        (await withTripIt((client) =>
          client.updateFlight({
            id: args.id,
            tripId: args.trip,
            displayName: args.name,
            supplierName: args.airline,
            supplierConfNum: args.confirmation,
            notes: args.notes,
            totalCost: args.cost,
            segment: {
              startDate: args.departDate,
              startTime: args.departTime,
              startTimezone: args.departTz,
              endDate: args.arriveDate,
              endTime: args.arriveTime,
              endTimezone: args.arriveTz,
              startCityName: args.from,
              startCountryCode: args.fromCode,
              endCityName: args.to,
              endCountryCode: args.toCode,
              marketingAirline: args.airlineCode,
              marketingFlightNumber: args.flightNum,
              aircraft: args.aircraft,
              serviceClass: args.serviceClass,
            },
          }),
        )) as Record<string, unknown>,
      ),
  );

  server.registerTool(
    "tripit_delete_flight",
    {
      title: "Delete a TripIt flight",
      description: "Permanently delete a flight after confirming it with tripit_get_flight.",
      inputSchema: {
        id: z.string().min(1).describe("Flight ID or UUID."),
      },
      outputSchema: normalizedToolOutputSchema,
      annotations: toolAnnotations("delete"),
    },
    async ({ id }) =>
      toolResult("tripit_delete_flight", async () =>
        (await withTripIt((client) => client.deleteFlight(id))) as Record<string, unknown>,
      ),
  );
}
