import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { ALL_TOOL_NAMES } from "../src/types";

type ToolResult = Awaited<ReturnType<Client["callTool"]>> & {
  structuredContent?: Record<string, any>;
};

type CreatedState = {
  trip?: string;
  lodging?: string;
  flight?: string;
  transport?: string;
  activity?: string;
};

const tested = new Set<string>();

function asArray<T>(value: T | T[] | undefined): T[] {
  return value === undefined ? [] : Array.isArray(value) ? value : [value];
}

function firstRecord(value: unknown, description: string): Record<string, any> {
  const item = asArray(value as Record<string, any> | Record<string, any>[]).find(
    (candidate) => typeof candidate === "object" && candidate !== null,
  );
  if (!item) throw new Error(`TripIt did not return ${description}.`);
  return item;
}

function identifier(value: unknown, description: string): string {
  const item = firstRecord(value, description);
  const id = item.uuid ?? item.id;
  if (typeof id !== "string" && typeof id !== "number") {
    throw new Error(`TripIt did not return an identifier for ${description}.`);
  }
  return String(id);
}

async function callTool(client: Client, name: string, args: Record<string, unknown> = {}): Promise<Record<string, any>> {
  const result = (await client.callTool({ name, arguments: args })) as ToolResult;
  const envelope = result.structuredContent;
  if (result.isError || envelope?.ok !== true || typeof envelope.data !== "object" || envelope.data === null) {
    const message = envelope?.error?.message ?? "MCP returned an unsuccessful or malformed result.";
    throw new Error(`${name} failed: ${message}`);
  }
  tested.add(name);
  return envelope.data;
}

async function bestEffort(client: Client, name: string, args: Record<string, unknown>): Promise<void> {
  try {
    await callTool(client, name, args);
  } catch (error) {
    console.error(`Cleanup warning: ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function main(): Promise<void> {
  const fixtureDirectory = await mkdtemp(join(tmpdir(), "tripit-mcp-live-"));
  const fixturePath = join(fixtureDirectory, "attachment.png");
  await writeFile(
    fixturePath,
    Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
      "base64",
    ),
  );

  const transport = new StdioClientTransport({
    command: "bun",
    args: ["run", "dist/index.js"],
    cwd: process.cwd(),
    env: {
      PATH: process.env.PATH ?? "",
      TRIPIT_CLIENT_ID: process.env.TRIPIT_CLIENT_ID ?? "",
      TRIPIT_USERNAME: process.env.TRIPIT_USERNAME ?? "",
      TRIPIT_PASSWORD: process.env.TRIPIT_PASSWORD ?? "",
    },
    stderr: "inherit",
  });
  const client = new Client({ name: "tripit-all-tools-live-test", version: "0.2.4" });
  const created: CreatedState = {};
  const unfiled = new Map<string, string>();
  await client.connect(transport);

  const now = new Date();
  const day = 24 * 60 * 60 * 1_000;
  const startDate = new Date(now.getTime() + 60 * day).toISOString().slice(0, 10);
  const middleDate = new Date(now.getTime() + 61 * day).toISOString().slice(0, 10);
  const endDate = new Date(now.getTime() + 63 * day).toISOString().slice(0, 10);
  const stamp = now.toISOString().replace(/[:.]/g, "-");
  const marker = `MCP All Tools ${stamp}`;

  try {
    const listedTools = await client.listTools();
    assert.deepEqual(
      new Set(listedTools.tools.map((tool) => tool.name)),
      new Set(ALL_TOOL_NAMES),
      "The live server tool list must match ALL_TOOL_NAMES.",
    );

    const tripCreation = await callTool(client, "tripit_create_trip", {
      name: marker,
      start: startDate,
      end: endDate,
      location: "Test City",
    });
    created.trip = identifier(tripCreation.Trip, "the test trip");

    const trips = await callTool(client, "tripit_list_trips", { pageSize: 100, pageNum: 1 });
    assert.ok(asArray<Record<string, any>>(trips.Trip).some((trip) => trip.uuid === created.trip));

    await callTool(client, "tripit_get_trip", { id: created.trip });
    await callTool(client, "tripit_update_trip", {
      id: created.trip,
      name: `${marker} Updated`,
      description: "Temporary full MCP tool validation trip.",
    });

    const lodging = await callTool(client, "tripit_create_lodging", {
      trip: created.trip,
      name: `${marker} Hotel`,
      checkin: startDate,
      checkout: endDate,
      checkinTime: "15:00",
      checkoutTime: "11:00",
      timezone: "UTC",
      address: "1 Test Street",
      city: "Test City",
      country: "US",
      notes: marker,
    });
    created.lodging = identifier(lodging.LodgingObject, "the test lodging");
    await callTool(client, "tripit_get_lodging", { id: created.lodging });
    await callTool(client, "tripit_update_lodging", {
      id: created.lodging,
      name: `${marker} Hotel Updated`,
      notes: `${marker} lodging update`,
    });

    const lodgingCaption = `${marker} lodging attachment`;
    await callTool(client, "tripit_attach_lodging_document", {
      id: created.lodging,
      file: fixturePath,
      name: lodgingCaption,
      mimeType: "image/png",
    });
    await callTool(client, "tripit_remove_lodging_document", {
      id: created.lodging,
      caption: lodgingCaption,
    });

    const flight = await callTool(client, "tripit_create_flight", {
      trip: created.trip,
      name: `${marker} Flight`,
      airline: "Test Air",
      from: "Test City",
      fromCode: "US",
      to: "Example City",
      toCode: "US",
      airlineCode: "ZZ",
      flightNum: "123",
      departDate: startDate,
      departTime: "09:00",
      departTz: "UTC",
      arriveDate: startDate,
      arriveTime: "10:30",
      arriveTz: "UTC",
      notes: marker,
    });
    created.flight = identifier(flight.AirObject, "the test flight");
    await callTool(client, "tripit_get_flight", { id: created.flight });
    await callTool(client, "tripit_update_flight", {
      id: created.flight,
      name: `${marker} Flight Updated`,
      notes: `${marker} flight update`,
    });

    const transportItem = await callTool(client, "tripit_create_transport", {
      trip: created.trip,
      from: "1 Test Street",
      to: "2 Example Avenue",
      departDate: middleDate,
      departTime: "08:00",
      arriveDate: middleDate,
      arriveTime: "08:30",
      timezone: "UTC",
      name: `${marker} Transport`,
      carrier: "Test Transit",
    });
    created.transport = identifier(transportItem.TransportObject, "the test transport");
    await callTool(client, "tripit_get_transport", { id: created.transport });
    await callTool(client, "tripit_update_transport", {
      id: created.transport,
      name: `${marker} Transport Updated`,
      carrier: "Updated Test Transit",
    });

    const activity = await callTool(client, "tripit_create_activity", {
      trip: created.trip,
      name: `${marker} Activity`,
      startDate: middleDate,
      startTime: "19:00",
      endDate: middleDate,
      endTime: "20:00",
      timezone: "UTC",
      address: "3 Activity Road",
      locationName: "Test Venue",
      city: "Test City",
      country: "US",
    });
    created.activity = identifier(activity.ActivityObject, "the test activity");
    await callTool(client, "tripit_get_activity", { id: created.activity });
    await callTool(client, "tripit_update_activity", {
      id: created.activity,
      name: `${marker} Activity Updated`,
      notes: `${marker} activity update`,
    });

    const genericCaption = `${marker} generic attachment`;
    await callTool(client, "tripit_attach_document", {
      id: created.activity,
      file: fixturePath,
      caption: genericCaption,
      mimeType: "image/png",
    });
    await callTool(client, "tripit_remove_document", {
      id: created.activity,
      caption: genericCaption,
    });

    const direct = await callTool(client, "tripit_create_trip_item", {
      trip: created.trip,
      item: {
        type: "car",
        name: `${marker} Car`,
        pickupDate: startDate,
        pickupTime: "12:00",
        pickupTimezone: "UTC",
        dropoffDate: endDate,
        dropoffTime: "12:00",
        dropoffTimezone: "UTC",
        pickupLocation: {
          name: "Test Rental Counter",
          address: "4 Rental Way",
          city: "Test City",
          country: "US",
        },
        dropoffLocation: {
          name: "Test Rental Counter",
          address: "4 Rental Way",
          city: "Test City",
          country: "US",
        },
        vehicle: { description: "Test Vehicle", type: "Test Class" },
        supplierName: "Test Rental",
      },
    });
    assert.equal(direct.created?.type, "car");
    const directCarId = String(direct.created?.uuid ?? direct.created?.id ?? "");
    assert.ok(directCarId, "Direct car creation must return an identifier.");
    const tripWithCar = await callTool(client, "tripit_get_trip", { id: created.trip });
    const persistedCar = asArray<Record<string, any>>(tripWithCar.CarObject).find(
      (car) => String(car.uuid ?? car.id) === directCarId,
    );
    assert.ok(persistedCar, "The direct car must be present in the destination trip.");
    assert.equal(persistedCar.start_location_name, "Test Rental Counter");
    assert.equal(persistedCar.end_location_name, "Test Rental Counter");
    assert.equal(persistedCar.car_description, "Test Vehicle");
    assert.equal(persistedCar.car_type, "Test Class");
    assert.equal(persistedCar.StartLocationAddress?.address, "4 Rental Way");
    assert.equal(persistedCar.EndLocationAddress?.address, "4 Rental Way");

    await callTool(client, "tripit_list_unfiled_items", { type: "note", pageSize: 100, pageNum: 1 });

    const replaceSource = await callTool(client, "tripit_create_item_without_trip", {
      item: { type: "note", name: `${marker} Replace Source`, text: marker },
    });
    const replaceId = identifier(replaceSource.NoteObject, "the replace-source note");
    unfiled.set(replaceId, "note");
    await callTool(client, "tripit_get_unfiled_item", { type: "note", id: replaceId });
    await callTool(client, "tripit_replace_unfiled_item", {
      id: replaceId,
      item: { type: "note", name: `${marker} Replaced`, text: `${marker} replaced` },
    });
    await callTool(client, "tripit_delete_unfiled_item", { type: "note", id: replaceId });
    unfiled.delete(replaceId);

    const assignSource = await callTool(client, "tripit_create_item_without_trip", {
      item: { type: "note", name: `${marker} Assign Source`, text: marker },
    });
    const assignId = identifier(assignSource.NoteObject, "the assignment-source note");
    unfiled.set(assignId, "note");
    await callTool(client, "tripit_assign_unfiled_item", { type: "note", id: assignId, trip: created.trip });
    unfiled.delete(assignId);

    const convertSource = await callTool(client, "tripit_create_item_without_trip", {
      item: { type: "note", name: `${marker} Convert Source`, text: marker },
    });
    const convertId = identifier(convertSource.NoteObject, "the conversion-source note");
    unfiled.set(convertId, "note");
    const conversion = await callTool(client, "tripit_convert_unfiled_item", {
      sourceType: "note",
      sourceId: convertId,
      trip: created.trip,
      target: {
        type: "activity",
        name: `${marker} Converted Activity`,
        startDate: middleDate,
        startTime: "14:00",
        endDate: middleDate,
        endTime: "15:00",
        timezone: "UTC",
        locationName: "Converted Test Venue",
        address: "5 Conversion Lane",
        city: "Test City",
        country: "US",
      },
      sourceDisposition: "delete",
    });
    assert.equal(conversion.converted, true);
    unfiled.delete(convertId);

    await callTool(client, "tripit_delete_activity", { id: created.activity });
    created.activity = undefined;
    await callTool(client, "tripit_delete_transport", { id: created.transport });
    created.transport = undefined;
    await callTool(client, "tripit_delete_flight", { id: created.flight });
    created.flight = undefined;
    await callTool(client, "tripit_delete_lodging", { id: created.lodging });
    created.lodging = undefined;
    await callTool(client, "tripit_delete_trip", { id: created.trip });
    const deletedTrip = created.trip;
    created.trip = undefined;

    const afterCleanup = await callTool(client, "tripit_list_trips", { pageSize: 100, pageNum: 1 });
    assert.ok(!asArray<Record<string, any>>(afterCleanup.Trip).some((trip) => trip.uuid === deletedTrip));

    assert.deepEqual(tested, new Set(ALL_TOOL_NAMES), "Every registered tool must complete a live MCP call.");
    console.log(JSON.stringify({ ok: true, tested: [...tested].sort(), cleanedTrip: deletedTrip }, null, 2));
  } finally {
    for (const [id, type] of unfiled) {
      await bestEffort(client, "tripit_delete_unfiled_item", { type, id });
    }
    if (created.activity) await bestEffort(client, "tripit_delete_activity", { id: created.activity });
    if (created.transport) await bestEffort(client, "tripit_delete_transport", { id: created.transport });
    if (created.flight) await bestEffort(client, "tripit_delete_flight", { id: created.flight });
    if (created.lodging) await bestEffort(client, "tripit_delete_lodging", { id: created.lodging });
    if (created.trip) await bestEffort(client, "tripit_delete_trip", { id: created.trip });
    await client.close();
    await rm(fixtureDirectory, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
