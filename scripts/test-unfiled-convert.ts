import assert from "node:assert/strict";
import type { TripItClient } from "../src/client";
import { buildConversionItem, convertUnfiledItem } from "../src/tools/unfiled";

const tripUuid = "0f133c42-eded-9000-0001-000016f7ad8c";
const lodgingUuid = "11111111-1111-9000-0001-111111111111";
const activityUuid = "22222222-2222-9000-0001-222222222222";
const events: string[] = [];
const posts: Array<{ url: string; body: Record<string, Record<string, unknown>> }> = [];
const originalFetch = globalThis.fetch;

globalThis.fetch = (async (input, init = {}) => {
  const url = String(input);
  const method = init.method ?? "GET";
  events.push(`${method} ${url}`);

  if (method === "POST") {
    const body = JSON.parse(new URLSearchParams(String(init.body)).get("json") ?? "") as Record<
      string,
      Record<string, unknown>
    >;
    posts.push({ url, body });

    if (url.includes("/v2/create/lodging/")) {
      return new Response(
        JSON.stringify({ LodgingObject: { uuid: lodgingUuid, trip_uuid: tripUuid } }),
        { status: 200 },
      );
    }
    if (url.includes("/v2/create/activity/")) {
      return new Response(
        JSON.stringify({ ActivityObject: { uuid: activityUuid, trip_uuid: tripUuid } }),
        { status: 200 },
      );
    }
  }

  if (url.includes("/v1/get/note/id/5538951469/")) {
    return new Response(
      JSON.stringify({
        NoteObject: {
          id: "5538951469",
          display_name: "Parks Canada reservation email",
          text: "Raw forwarded reservation confirmation",
        },
      }),
      { status: 200 },
    );
  }
  if (url.includes("/v1/get/activity/id/1015954277/")) {
    return new Response(
      JSON.stringify({ ActivityObject: { id: "1015954277", display_name: "Activity" } }),
      { status: 200 },
    );
  }
  if (url.includes(`/v2/get/trip/uuid/${tripUuid}/`)) {
    return new Response(JSON.stringify({ Trip: { uuid: tripUuid, display_name: "Calgary" } }), { status: 200 });
  }
  if (url.includes(`/v2/get/lodging/uuid/${lodgingUuid}/`)) {
    return new Response(
      JSON.stringify({
        LodgingObject: {
          uuid: lodgingUuid,
          trip_uuid: tripUuid,
          display_name: "Tunnel Mountain Village 1",
        },
      }),
      { status: 200 },
    );
  }
  if (url.includes(`/v2/get/activity/uuid/${activityUuid}/`)) {
    return new Response(
      JSON.stringify({
        ActivityObject: { uuid: activityUuid, trip_uuid: tripUuid, display_name: "Registration" },
      }),
      { status: 200 },
    );
  }
  if (url.includes("/v1/delete/note/id/5538951469/")) {
    return new Response(JSON.stringify({}), { status: 200 });
  }

  throw new Error(`Unexpected request: ${method} ${url}`);
}) as typeof fetch;

try {
  const client = { getAccessToken: () => "test-token" } as TripItClient;
  const lodging = await convertUnfiledItem(
    client,
    "note",
    "5538951469",
    tripUuid,
    {
      type: "lodging",
      name: "Tunnel Mountain Village 1",
      checkin: "2026-09-20",
      checkout: "2026-09-23",
      checkinTime: "14:00",
      checkoutTime: "11:00",
      timezone: "America/Edmonton",
      address: "Tunnel Mountain Village 1, Banff National Park",
      city: "Banff",
      state: "AB",
      country: "CA",
      confirmation: "INPC26-55623486B1",
      supplierName: "Parks Canada",
      bookingSiteName: "Parks Canada Reservation Service",
      cost: "CAD 149.50",
      notes: "Location B, Site B40; party of 6 adults",
      numberGuests: 6,
      numberRooms: 1,
      roomType: "Campsite B40",
    },
    "delete",
  );

  assert.equal(lodging.converted, true);
  assert.equal((lodging.source as Record<string, unknown>).status, "deleted");
  const lodgingPayload = posts[0].body.LodgingObject;
  assert.deepEqual(lodgingPayload, {
    trip_uuid: tripUuid,
    display_name: "Tunnel Mountain Village 1",
    booking_site_name: "Parks Canada Reservation Service",
    supplier_conf_num: "INPC26-55623486B1",
    supplier_name: "Parks Canada",
    notes: "Location B, Site B40; party of 6 adults",
    total_cost: "CAD 149.50",
    StartDateTime: { date: "2026-09-20", time: "14:00:00", timezone: "America/Edmonton" },
    EndDateTime: { date: "2026-09-23", time: "11:00:00", timezone: "America/Edmonton" },
    Address: {
      address: "Tunnel Mountain Village 1, Banff National Park",
      city: "Banff",
      state: "AB",
      country: "CA",
    },
    number_guests: "6",
    number_rooms: "1",
    room_type: "Campsite B40",
  });

  const verifyIndex = events.findIndex((event) => event.includes(`/v2/get/lodging/uuid/${lodgingUuid}/`));
  const deleteIndex = events.findIndex((event) => event.includes("/v1/delete/note/id/5538951469/"));
  assert.ok(verifyIndex >= 0 && deleteIndex > verifyIndex, "source deletion must happen after target verification");

  const activity = await convertUnfiledItem(
    client,
    "activity",
    "1015954277",
    tripUuid,
    {
      type: "activity",
      name: "Registration",
      startDate: "2019-05-20",
      startTime: "09:00",
      endDate: "2019-05-20",
      endTime: "17:00",
      timezone: "America/Denver",
      locationName: "Colorado Convention Center",
      address: "700 14th Street",
      city: "Denver",
      state: "CO",
      country: "US",
      confirmation: "1990",
      supplierName: "Experient",
      purchased: true,
      participants: [{ firstName: "Example", lastName: "Traveler" }],
    },
    "keep_unfiled",
  );

  assert.equal((activity.source as Record<string, unknown>).status, "kept_unfiled");
  const activityPayload = posts[1].body.ActivityObject;
  assert.equal(activityPayload.display_name, "Registration");
  assert.equal(activityPayload.supplier_conf_num, "1990");
  assert.equal(activityPayload.location_name, "Colorado Convention Center");
  assert.deepEqual(activityPayload.Participant, [{ first_name: "Example", last_name: "Traveler" }]);

  const flightPayload = buildConversionItem(
    {
      type: "air",
      name: "Example Air 123",
      airline: "Example Air",
      confirmation: "ABC123",
      cost: "USD 425.00",
      travelers: [{ firstName: "Example", lastName: "Traveler" }],
      segments: [
        {
          departDate: "2026-09-17",
          departTime: "08:00",
          departTimezone: "America/Chicago",
          arriveDate: "2026-09-17",
          arriveTime: "10:30",
          arriveTimezone: "America/Edmonton",
          from: "Chicago",
          fromCountry: "US",
          fromAirport: "ORD",
          to: "Calgary",
          toCountry: "CA",
          toAirport: "YYC",
          airlineCode: "EA",
          flightNumber: "123",
          seats: "12A",
        },
      ],
    },
    tripUuid,
  );
  assert.equal(flightPayload.trip_uuid, tripUuid);
  assert.equal((flightPayload.Segment as Record<string, unknown>[])[0].start_airport_code, "ORD");
  assert.equal((flightPayload.Traveler as Record<string, unknown>[])[0].last_name, "Traveler");

  const transportPayload = buildConversionItem(
    {
      type: "transport",
      name: "Airport transfer",
      from: "Calgary International Airport",
      fromName: "YYC",
      to: "71 Sandstone Drive NW, Calgary",
      toName: "Airbnb",
      departDate: "2026-09-17",
      departTime: "11:00",
      arriveDate: "2026-09-17",
      arriveTime: "11:30",
      timezone: "America/Edmonton",
      carrier: "Example Shuttle",
      confirmation: "SHUTTLE1",
      vehicle: "Van",
    },
    tripUuid,
  );
  assert.equal(transportPayload.display_name, "Airport transfer");
  assert.equal((transportPayload.Segment as Record<string, unknown>[])[0].confirmation_num, "SHUTTLE1");

  console.log("Structured unfiled conversion integration test passed.");
} finally {
  globalThis.fetch = originalFetch;
}
