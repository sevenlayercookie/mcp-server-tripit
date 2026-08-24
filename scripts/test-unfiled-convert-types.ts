import assert from "node:assert/strict";
import { buildConversionItem } from "../src/tools/unfiled";

const trip = "0f133c42-eded-9000-0001-000016f7ad8c";

const car = buildConversionItem(
  {
    type: "car",
    name: "Calgary rental car",
    pickupDate: "2026-09-17",
    pickupTime: "12:00",
    pickupTimezone: "America/Edmonton",
    dropoffDate: "2026-09-24",
    dropoffTime: "09:00",
    dropoffTimezone: "America/Edmonton",
    pickupAddress: "2000 Airport Road NE",
    pickupCity: "Calgary",
    pickupState: "AB",
    pickupCountry: "CA",
    pickupName: "YYC Rental Car Centre",
    dropoffAddress: "2000 Airport Road NE",
    dropoffCity: "Calgary",
    dropoffState: "AB",
    dropoffCountry: "CA",
    dropoffName: "YYC Rental Car Centre",
    bookingDate: "2026-08-24",
    bookingRate: "CAD 75.00 per day",
    bookingConfirmation: "BOOK123",
    bookingSiteName: "Example Travel",
    bookingSitePhone: "+1 800 555 0100",
    bookingSiteEmail: "booking@example.com",
    bookingSiteUrl: "https://example.com/booking",
    recordLocator: "LOC123",
    confirmation: "CAR123",
    supplierContact: "Rental Desk",
    supplierName: "Example Car Rental",
    supplierPhone: "+1 403 555 0101",
    supplierEmail: "desk@example.com",
    supplierUrl: "https://example.com/rental",
    purchased: true,
    notes: "Pick up at the airport terminal.",
    restrictions: "Cancel at least 24 hours in advance.",
    cost: "CAD 525.00",
    agency: { name: "Example Travel", contact: "Travel Desk" },
    reservationHolder: { firstName: "Example", lastName: "Traveler" },
    drivers: [
      {
        firstName: "Example",
        lastName: "Traveler",
        frequentTravelerNumber: "RENTAL123",
        frequentTravelerSupplier: "Example Car Rental",
      },
    ],
    carDescription: "Compact SUV",
    carType: "SUV",
    mileageCharges: "Unlimited kilometres",
  },
  trip,
);
assert.deepEqual(Object.keys(car), [
  "trip_uuid",
  "display_name",
  "booking_date",
  "booking_rate",
  "booking_site_conf_num",
  "booking_site_name",
  "booking_site_phone",
  "booking_site_email_address",
  "booking_site_url",
  "record_locator",
  "supplier_conf_num",
  "supplier_contact",
  "supplier_email_address",
  "supplier_name",
  "supplier_phone",
  "supplier_url",
  "is_purchased",
  "notes",
  "restrictions",
  "total_cost",
  "Agency",
  "StartDateTime",
  "EndDateTime",
  "StartLocationAddress",
  "EndLocationAddress",
  "ReservationHolder",
  "Driver",
  "start_location_name",
  "end_location_name",
  "car_description",
  "car_type",
  "mileage_charges",
]);

const parking = buildConversionItem(
  {
    type: "parking",
    name: "YYC Airport Parking",
    startDate: "2026-09-17",
    startTime: "10:00",
    endDate: "2026-09-24",
    endTime: "10:00",
    timezone: "America/Edmonton",
    address: "2000 Airport Road NE",
    city: "Calgary",
    state: "AB",
    country: "CA",
    confirmation: "PARK123",
    cost: "CAD 140.00",
    locationName: "YYC Economy Lot",
    locationHours: "24 hours",
    locationPhone: "+1 403 555 0100",
    valetTicket: "V123",
  },
  trip,
);
assert.equal(parking.location_name, "YYC Economy Lot");
assert.equal(parking.valet_ticket_num, "V123");

const cruise = buildConversionItem(
  {
    type: "cruise",
    name: "Inside Passage Cruise",
    supplierName: "Example Cruise Line",
    confirmation: "SEA123",
    shipName: "Example Star",
    cabinNumber: "8021",
    cabinType: "Balcony",
    dining: "Early seating",
    travelers: [{ firstName: "Example", lastName: "Traveler" }],
    segments: [
      {
        startDate: "2026-09-25",
        startTime: "16:00",
        endDate: "2026-09-26",
        endTime: "08:00",
        timezone: "America/Vancouver",
        locationName: "Vancouver Cruise Terminal",
        address: "999 Canada Place",
        city: "Vancouver",
        state: "BC",
        country: "CA",
        portOfCall: true,
      },
    ],
  },
  trip,
);
assert.equal((cruise.Segment as Record<string, unknown>[])[0].detail_type_code, "P");
assert.equal(cruise.ship_name, "Example Star");

const directions = buildConversionItem(
  {
    type: "directions",
    name: "Airport to Airbnb",
    date: "2026-09-17",
    time: "11:00",
    timezone: "America/Edmonton",
    from: "Calgary International Airport",
    fromCity: "Calgary",
    fromState: "AB",
    fromCountry: "CA",
    to: "71 Sandstone Drive NW",
    toCity: "Calgary",
    toState: "AB",
    toCountry: "CA",
    mode: "driving",
  },
  trip,
);
assert.equal(directions.detail_type_code, "D");
assert.deepEqual(Object.keys(directions), [
  "trip_uuid",
  "display_name",
  "DateTime",
  "StartAddress",
  "EndAddress",
  "detail_type_code",
]);

const map = buildConversionItem(
  {
    type: "map",
    name: "Banff campsite map",
    date: "2026-09-20",
    address: "Tunnel Mountain Village 1",
    city: "Banff",
    state: "AB",
    country: "CA",
  },
  trip,
);
assert.equal((map.Address as Record<string, unknown>).city, "Banff");

const note = buildConversionItem(
  {
    type: "note",
    name: "Entry instructions",
    date: "2026-09-23",
    address: "71 Sandstone Drive NW",
    city: "Calgary",
    state: "AB",
    country: "CA",
    source: "Airbnb",
    text: "Use the side entrance.",
    url: "https://example.com/reservation",
    notes: "Contact host on arrival.",
    article: true,
  },
  trip,
);
assert.equal(note.detail_type_code, "A");
assert.equal(note.text, "Use the side entrance.");

const rail = buildConversionItem(
  {
    type: "rail",
    name: "Rocky Mountain Train",
    supplierName: "Example Rail",
    confirmation: "RAIL123",
    cost: "CAD 320.00",
    travelers: [{ firstName: "Example", lastName: "Traveler" }],
    segments: [
      {
        departDate: "2026-09-19",
        departTime: "08:00",
        departTimezone: "America/Edmonton",
        arriveDate: "2026-09-19",
        arriveTime: "10:30",
        arriveTimezone: "America/Edmonton",
        from: "Calgary Station",
        fromAddress: "123 Railway Street",
        to: "Banff Station",
        toAddress: "327 Railway Avenue",
        carrier: "Example Rail",
        coach: "A",
        confirmation: "SEG123",
        seats: "12A, 12B",
        serviceClass: "First",
        trainNumber: "77",
        trainType: "Express",
      },
    ],
  },
  trip,
);
assert.equal((rail.Segment as Record<string, unknown>[])[0].train_number, "77");
assert.deepEqual(rail.Traveler, [{ first_name: "Example", last_name: "Traveler" }]);

const restaurant = buildConversionItem(
  {
    type: "restaurant",
    name: "Example Bistro",
    date: "2026-09-18",
    time: "19:00",
    timezone: "America/Edmonton",
    address: "123 Main Street",
    city: "Calgary",
    state: "AB",
    country: "CA",
    confirmation: "DINE123",
    reservationHolder: { firstName: "Example", lastName: "Traveler" },
    attendees: [{ firstName: "Guest", lastName: "Traveler" }],
    cuisine: "Canadian",
    dressCode: "Casual",
    hours: "17:00-23:00",
    numberPatrons: 2,
    priceRange: "$$$",
  },
  trip,
);
assert.equal(restaurant.supplier_name, "Example Bistro");
assert.equal(restaurant.number_patrons, "2");

export const additionalConversionPayloads = {
  CarObject: car,
  ParkingObject: parking,
  CruiseObject: cruise,
  DirectionsObject: directions,
  MapObject: map,
  NoteObject: note,
  RailObject: rail,
  RestaurantObject: restaurant,
};

console.log("All writable conversion target payload tests passed.");
