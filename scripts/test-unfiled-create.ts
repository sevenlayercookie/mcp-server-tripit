import assert from "node:assert/strict";
import type { TripItClient } from "../src/client";
import { createItemWithoutTrip } from "../src/tools/unfiled";

const posts: Array<{ url: string; body: Record<string, Record<string, unknown>> }> = [];
const exportPayloads: Array<Record<string, Record<string, unknown>>> = [];
const originalFetch = globalThis.fetch;

globalThis.fetch = (async (input, init = {}) => {
  const url = String(input);
  assert.equal(init.method, "POST");
  const body = JSON.parse(new URLSearchParams(String(init.body)).get("json") ?? "") as Record<
    string,
    Record<string, unknown>
  >;
  posts.push({ url, body });
  return new Response(JSON.stringify(body), { status: 200 });
}) as typeof fetch;

try {
  const client = { getAccessToken: () => "test-token" } as TripItClient;

  await createItemWithoutTrip(client, {
    type: "car",
    name: "Avis Chrysler Pacifica",
    supplierName: "Avis",
    pickupDate: "2026-09-17",
    pickupTime: "11:00",
    pickupTimezone: "America/Edmonton",
    dropoffDate: "2026-09-24",
    dropoffTime: "22:30",
    dropoffTimezone: "America/Edmonton",
    pickupLocation: {
      name: "YYC",
      address: "Calgary International Airport",
      city: "Calgary",
      country: "CA",
    },
    dropoffLocation: { name: "YYC" },
    vehicle: { description: "Chrysler Pacifica", type: "Minivan" },
  });

  await createItemWithoutTrip(client, {
    type: "note",
    name: "Entry instructions",
    date: "2026-09-23",
    timezone: "America/Edmonton",
    address: "71 Sandstone Drive NW",
    city: "Calgary",
    country: "CA",
    text: "Use the side entrance.",
    source: "Host",
  });

  assert.equal(posts.length, 2);
  posts.forEach((post) => {
    assert.equal("Request" in post.body, false);
  });
  assert.equal(posts[0]?.url, "https://api.tripit.com/v2/create/car/format/json");
  assert.equal(posts[1]?.url, "https://api.tripit.com/v2/create/note/format/json");

  assert.deepEqual(posts[0].body, {
    CarObject: {
      display_name: "Avis Chrysler Pacifica",
      supplier_name: "Avis",
      StartDateTime: { date: "2026-09-17", time: "11:00:00", timezone: "America/Edmonton" },
      EndDateTime: { date: "2026-09-24", time: "22:30:00", timezone: "America/Edmonton" },
      StartLocationAddress: { address: "Calgary International Airport", city: "Calgary", country: "CA" },
      start_location_name: "YYC",
      end_location_name: "YYC",
      car_description: "Chrysler Pacifica",
      car_type: "Minivan",
    },
  });

  assert.deepEqual(posts[1].body, {
    NoteObject: {
      display_name: "Entry instructions",
      DateTime: { date: "2026-09-23", timezone: "America/Edmonton" },
      Address: { address: "71 Sandstone Drive NW", city: "Calgary", country: "CA" },
      source: "Host",
      text: "Use the side entrance.",
    },
  });

  exportPayloads.push(...posts.map((post) => post.body));

  console.log("Typed create-without-trip envelope and field-order tests passed.");
} finally {
  globalThis.fetch = originalFetch;
}

export const unfiledCreatePayloads = exportPayloads;
