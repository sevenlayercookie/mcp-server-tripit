import assert from "node:assert/strict";
import type { TripItClient } from "../src/client";
import { assignUnfiledItem } from "../src/tools/unfiled";

const currentTripUuid = "0f133c42-eded-9000-0001-000016f7ad8c";
const pastTripUuid = "5a3b5c59-6c68-9000-0001-00000f24ffab";

const sourceObjects: Record<string, [string, Record<string, unknown>]> = {
  "1000000001": [
    "ActivityObject",
    {
      id: "1000000001",
      relative_url: "/reservation/show/id/1000000001",
      display_name: "Activity",
      is_display_name_auto_generated: "true",
      last_modified: "1555728553",
      booking_site_conf_num: "1990",
      booking_site_name: "Example booking site",
      is_purchased: "true",
      is_tripit_booking: "false",
      Participant: { first_name: "Example", last_name: "Traveler" },
    },
  ],
  "5000000001": [
    "NoteObject",
    {
      id: "5000000001",
      relative_url: "/trip_item/show/id/5000000001",
      display_name: "First note",
      is_display_name_auto_generated: "false",
      last_modified: "1787546677",
      text: "First reservation details",
    },
  ],
  "5000000002": [
    "NoteObject",
    {
      id: "5000000002",
      relative_url: "/trip_item/show/id/5000000002",
      display_name: "Second note",
      is_display_name_auto_generated: "false",
      last_modified: "1787546686",
      text: "Second reservation details",
    },
  ],
};

const v2Trips: Record<string, Record<string, unknown>> = {
  [currentTripUuid]: {
    uuid: currentTripUuid,
    public_guid: "CURRENT-GUID",
    start_date: "2026-09-17",
    end_date: "2026-09-24",
    display_name: "Current trip",
    primary_location: "Current location",
  },
  [pastTripUuid]: {
    uuid: pastTripUuid,
    public_guid: "PAST-GUID",
    start_date: "2019-05-18",
    end_date: "2019-05-25",
    display_name: "Past trip",
    primary_location: "Past location",
  },
};

const v1Trips = [
  { ...v2Trips[currentTripUuid], id: "385330572" },
  { ...v2Trips[pastTripUuid], id: "254083243" },
];

const posts: Array<{ url: string; json: Record<string, Record<string, unknown>> }> = [];
const originalFetch = globalThis.fetch;

globalThis.fetch = (async (input, init = {}) => {
  const url = String(input);
  if ((init.method ?? "GET") === "POST") {
    const json = JSON.parse(new URLSearchParams(String(init.body)).get("json") ?? "") as Record<
      string,
      Record<string, unknown>
    >;
    posts.push({ url, json });
    return new Response(JSON.stringify(json), { status: 200 });
  }

  const sourceMatch = url.match(/\/v1\/get\/(activity|note)\/id\/(\d+)\/format\/json/);
  if (sourceMatch) {
    const [key, value] = sourceObjects[sourceMatch[2]];
    return new Response(JSON.stringify({ [key]: value }), { status: 200 });
  }

  const tripMatch = url.match(/\/v2\/get\/trip\/uuid\/([^/]+)\/format\/json/);
  if (tripMatch) {
    return new Response(JSON.stringify({ Trip: v2Trips[decodeURIComponent(tripMatch[1])] }), { status: 200 });
  }

  if (url.includes("/v1/list/trip/traveler/all/")) {
    const trips = url.includes("/past/true/") ? [v1Trips[1]] : [v1Trips[0]];
    return new Response(JSON.stringify({ Trip: trips, page_num: "1", max_page: "1" }), { status: 200 });
  }

  throw new Error(`Unexpected request: ${url}`);
}) as typeof fetch;

try {
  const client = { getAccessToken: () => "test-token" } as TripItClient;
  await assignUnfiledItem(client, "activity", "1000000001", pastTripUuid);
  await assignUnfiledItem(client, "note", "5000000001", currentTripUuid);
  await assignUnfiledItem(client, "note", "5000000002", currentTripUuid);

  const expected = [
    ["activity", "1000000001", "ActivityObject", "254083243"],
    ["note", "5000000001", "NoteObject", "385330572"],
    ["note", "5000000002", "NoteObject", "385330572"],
  ];
  assert.equal(posts.length, expected.length);

  posts.forEach((post, index) => {
    const [type, id, root, tripId] = expected[index];
    assert.equal(post.url, `https://api.tripit.com/v1/replace/${type}/id/${id}/format/json`);
    assert.equal(post.json[root].trip_id, tripId);
    assert.equal("id" in post.json[root], false);
    assert.equal("uuid" in post.json[root], false);
    assert.equal("trip_uuid" in post.json[root], false);
  });

  console.log("Numeric unfiled assignment integration test passed.");
} finally {
  globalThis.fetch = originalFetch;
}
