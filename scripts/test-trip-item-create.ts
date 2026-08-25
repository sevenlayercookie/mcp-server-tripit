import assert from "node:assert/strict";
import type { TripItClient } from "../src/client";
import { createTripItem, type WritableItemInput } from "../src/tools/unfiled";

const tripId = "2468";
const tripUuid = "0f133c42-eded-9000-0001-000016f7ad8c";
const objectKeys = {
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
} as const;

const items: WritableItemInput[] = [
  {
    type: "air",
    name: "AC 123",
    airline: "Air Canada",
    segments: [{
      departDate: "2026-09-17", departTime: "09:00", departTimezone: "America/Edmonton",
      arriveDate: "2026-09-17", arriveTime: "10:00", arriveTimezone: "America/Vancouver",
      from: "Calgary", to: "Vancouver", airlineCode: "AC", flightNumber: "123",
    }],
  },
  { type: "activity", name: "Calgary Tower" },
  {
    type: "car", name: "Avis Chrysler Pacifica",
    pickupDate: "2026-09-17", pickupTime: "11:00", pickupTimezone: "America/Edmonton",
    dropoffDate: "2026-09-24", dropoffTime: "22:30", dropoffTimezone: "America/Edmonton",
    carType: "Chrysler Pacifica",
  },
  {
    type: "cruise", name: "Harbour cruise",
    segments: [{ startDate: "2026-09-18", endDate: "2026-09-18", locationName: "Vancouver" }],
  },
  {
    type: "parking", name: "YYC parking",
    startDate: "2026-09-17", startTime: "10:00", endDate: "2026-09-24", endTime: "23:00",
    timezone: "America/Edmonton", address: "2000 Airport Road NE",
  },
  { type: "directions", name: "Airport to hotel", from: "YYC", to: "Downtown Calgary" },
  {
    type: "lodging", name: "Calgary Hotel", checkin: "2026-09-17", checkout: "2026-09-24",
    timezone: "America/Edmonton", address: "123 Centre Street",
  },
  { type: "map", name: "Calgary map", address: "Calgary, AB" },
  { type: "note", name: "Entry instructions", text: "Use the side entrance." },
  {
    type: "rail", name: "Rocky Mountaineer",
    segments: [{
      departDate: "2026-09-18", departTime: "08:00", departTimezone: "America/Edmonton",
      arriveDate: "2026-09-18", arriveTime: "17:00", arriveTimezone: "America/Edmonton",
      from: "Calgary", to: "Banff",
    }],
  },
  {
    type: "restaurant", name: "River Café", date: "2026-09-19", time: "19:00",
    timezone: "America/Edmonton", address: "Prince's Island Park",
  },
  {
    type: "transport", name: "Airport transfer", from: "YYC", to: "Downtown Calgary",
    departDate: "2026-09-17", departTime: "11:15", arriveDate: "2026-09-17", arriveTime: "11:45",
    timezone: "America/Edmonton",
  },
];

const posts: Array<{ key: string; object: Record<string, unknown> }> = [];
const originalFetch = globalThis.fetch;
let omitCreatedIdentifier = false;

globalThis.fetch = (async (input, init = {}) => {
  const url = String(input);

  if (init.method === "POST") {
    assert.equal(url, "https://api.tripit.com/v1/create/format/json");
    const body = JSON.parse(new URLSearchParams(String(init.body)).get("json") ?? "") as Record<
      string,
      Record<string, unknown>
    >;
    const [key] = Object.keys(body);
    assert.ok(key);
    const object = body[key];
    assert.ok(object);
    posts.push({ key, object });
    const created = omitCreatedIdentifier ? { trip_id: tripId } : { id: String(1000 + posts.length), trip_id: tripId };
    return new Response(JSON.stringify({ [key]: created }), {
      status: 200,
    });
  }

  if (url.includes(`/v1/get/trip/id/${tripId}/`)) {
    return new Response(JSON.stringify({ Trip: { id: tripId, uuid: tripUuid } }), { status: 200 });
  }
  if (url.includes(`/v2/get/trip/uuid/${tripUuid}/`)) {
    return new Response(JSON.stringify({ Trip: { uuid: tripUuid, display_name: "Calgary" } }), { status: 200 });
  }
  if (url.includes("/v1/list/trip/")) {
    const trips = url.includes("/past/true") ? [] : [{ id: tripId, uuid: tripUuid, display_name: "Calgary" }];
    return new Response(JSON.stringify({ Trip: trips, max_page: 1 }), { status: 200 });
  }

  const match = url.match(/\/v1\/get\/([^/]+)\/id\/([1-9]\d*)\//);
  assert.ok(match, `Unexpected GET ${url}`);
  const [, type, id] = match;
  const key = objectKeys[type as keyof typeof objectKeys];
  assert.ok(key, `Unexpected verification type ${type}`);
  return new Response(JSON.stringify({ [key]: { id, trip_id: tripId } }), { status: 200 });
}) as typeof fetch;

try {
  const client = { getAccessToken: () => "test-token" } as TripItClient;

  for (const item of items) {
    const result = await createTripItem(client, tripId, item);
    assert.equal(result.partial_success, undefined);
    assert.equal((result.created as Record<string, unknown>).type, item.type);
  }

  assert.equal(posts.length, 12);
  assert.deepEqual(new Set(posts.map((post) => post.key)), new Set(Object.values(objectKeys)));
  for (const post of posts) {
    assert.equal(post.object.trip_id, tripId);
    assert.equal("trip_uuid" in post.object, false);
    assert.equal(Object.keys(post.object)[0], "trip_id", `${post.key} must place trip_id first for XSD order.`);
  }

  const uuidResult = await createTripItem(client, tripUuid, {
    type: "note",
    name: "UUID destination",
    text: "Resolved through the v1 trip list.",
  });
  assert.equal(uuidResult.partial_success, undefined);
  assert.equal(posts.at(-1)?.object.trip_id, tripId);

  omitCreatedIdentifier = true;
  const partialResult = await createTripItem(client, tripId, {
    type: "note",
    name: "Check before retrying",
  });
  assert.equal(partialResult.partial_success, true);
  assert.match(String(partialResult.warning), /before retrying to avoid a duplicate/);

  console.log("Direct trip-item creation passed for all 12 writable types, UUID destinations, and partial-success safety.");
} finally {
  globalThis.fetch = originalFetch;
}
