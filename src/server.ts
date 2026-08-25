import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerActivityTools } from "./tools/activities";
import { registerDocumentTools } from "./tools/documents";
import { registerFlightTools } from "./tools/flights";
import { registerHotelTools } from "./tools/hotels";
import { registerItemTools } from "./tools/items";
import { registerTransportTools } from "./tools/transport";
import { registerTripTools } from "./tools/trips";
import { registerUnfiledTools } from "./tools/unfiled";

export const MCP_SERVER_INSTRUCTIONS =
  "List or get TripIt resources before writing. IDs may be numeric v1 IDs or UUIDs; reuse identifiers returned by read tools and never guess. Do not retry failed writes unless error.retryable is true. If creation or conversion reports partial_success, inspect the destination before retrying to avoid duplicates.";

export function createServer(): McpServer {
  const server = new McpServer(
    { name: "tripit", version: "0.2.4" },
    { instructions: MCP_SERVER_INSTRUCTIONS },
  );

  registerTripTools(server);
  registerHotelTools(server);
  registerFlightTools(server);
  registerTransportTools(server);
  registerActivityTools(server);
  registerDocumentTools(server);
  registerItemTools(server);
  registerUnfiledTools(server);

  return server;
}
