import assert from "node:assert/strict";
import type { TripItClient } from "../src/client";
import { createUnfiledItem } from "../src/tools/unfiled";

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

  await createUnfiledItem(client, "car", {
    car_type: "Chrysler Pacifica",
    end_location_name: "YYC",
    EndDateTime: { timezone: "America/Edmonton", time: "22:30:00", date: "2026-09-24" },
    supplier_name: "Avis",
    StartLocationAddress: { country: "CA", city: "Calgary", address: "Calgary International Airport" },
    display_name: "Avis Chrysler Pacifica",
    start_location_name: "YYC",
    StartDateTime: { timezone: "America/Edmonton", time: "11:00:00", date: "2026-09-17" },
  });

  await createUnfiledItem(client, "note", {
    text: "Use the side entrance.",
    source: "Host",
    Address: { country: "CA", city: "Calgary", address: "71 Sandstone Drive NW" },
    DateTime: { timezone: "America/Edmonton", date: "2026-09-23" },
    display_name: "Entry instructions",
  });

  assert.equal(posts.length, 2);
  posts.forEach((post) => {
    assert.equal(post.url, "https://api.tripit.com/v1/create/format/json");
    assert.equal("Request" in post.body, false);
  });

  assert.deepEqual(posts[0].body, {
    CarObject: {
      display_name: "Avis Chrysler Pacifica",
      supplier_name: "Avis",
      StartDateTime: { date: "2026-09-17", time: "11:00:00", timezone: "America/Edmonton" },
      EndDateTime: { date: "2026-09-24", time: "22:30:00", timezone: "America/Edmonton" },
      StartLocationAddress: { address: "Calgary International Airport", city: "Calgary", country: "CA" },
      start_location_name: "YYC",
      end_location_name: "YYC",
      car_type: "Chrysler Pacifica",
    },
  });
  assert.equal("car_description" in posts[0].body.CarObject, false);

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

  console.log("Unfiled v1 create envelope and field-order tests passed.");
} finally {
  globalThis.fetch = originalFetch;
}

export const unfiledCreatePayloads = exportPayloads;
