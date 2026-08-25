# mcp-server-tripit

`mcp-server-tripit` exposes the TripIt API as an MCP server.

It is built on top of the [`tripit-cli`](https://github.com/dvcrn/tripit-cli) project and uses the published [`tripit`](https://www.npmjs.com/package/tripit) package to access the full TripIt API.

Deploy this server directly to [MCP Nest](https://mcpnest.dev)

<a href="https://mcpnest.dev/deploy?server=mcp-server-tripit&package-manager=npx&env[TRIPIT_USERNAME]=&env[TRIPIT_PASSWORD]=">
    <img src="https://mcpnest.dev/images/deploy-on-mcpnest.png" alt="Deploy on MCP Nest" height="32" />
  </a>

## Install

Run it directly with:

```bash
npx -y mcp-server-tripit
```

## Usage with Claude

Add it to your MCP configuration:

```json
{
  "mcpServers": {
    "tripit": {
      "command": "npx",
      "args": ["-y", "mcp-server-tripit"],
      "env": {
        "TRIPIT_USERNAME": "your-tripit-username",
        "TRIPIT_PASSWORD": "your-tripit-password"
      }
    }
  }
}
```

If you want to supply the optional client id too:

```json
{
  "mcpServers": {
    "tripit": {
      "command": "npx",
      "args": ["-y", "mcp-server-tripit"],
      "env": {
        "TRIPIT_USERNAME": "your-tripit-username",
        "TRIPIT_PASSWORD": "your-tripit-password",
        "TRIPIT_CLIENT_ID": "your-tripit-client-id"
      }
    }
  }
}
```

## Configuration

The server reads TripIt credentials from environment variables:

Required:

- `TRIPIT_USERNAME`
- `TRIPIT_PASSWORD`

Optional:

- `TRIPIT_CLIENT_ID`

If `TRIPIT_CLIENT_ID` is set, it is passed through to the `tripit` client. If it is omitted, the server does not pass it.

If you use `fnox`, you can also run it like this:

```bash
fnox x -- npx -y mcp-server-tripit
```

## What it can do

Built on top of [`dvcrn/tripit-cli`](https://github.com/dvcrn/tripit-cli), this MCP server exposes the TripIt API for common travel workflows, including:

- listing and fetching trips
- creating, updating, and deleting trips
- managing hotel reservations
- managing flights
- managing transport segments
- managing activities
- listing, fetching, creating, replacing, assigning, converting, and deleting unfiled travel items
- converting raw unfiled items into typed air, activity, car, parking, cruise, directions, lodging, map, note, rail, restaurant, or transport objects
- attaching and removing documents from supported TripIt objects

## Tool contract

Tool names are verb-first, for example `tripit_list_trips`, `tripit_get_trip`, and `tripit_create_lodging`.
Every tool returns the same structured envelope:

```json
{
  "ok": true,
  "operation": "tripit_get_trip",
  "data": {},
  "warnings": []
}
```

Failures set `isError: true` and return `ok: false` with a stable error code, message, retryability flag, and optional upstream HTTP status. Do not retry writes unless `error.retryable` is true. Conversion results with `partial_success` must be inspected before retrying to avoid duplicates.

Create-without-trip, replacement, and conversion accept typed discriminated item schemas for air, activity, car, parking, cruise, directions, lodging, map, note, rail, restaurant, and transport. Weather remains read-only.
