import assert from "node:assert/strict";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { errorResult, normalizedToolOutputSchema, successResult, toolResult } from "../src/results";
import { MCP_SERVER_INSTRUCTIONS } from "../src/server";
import { ALL_TOOL_NAMES } from "../src/types";
import { toolAnnotations } from "../src/tools/common";
import { writableItemSchema } from "../src/tools/unfiled";
import { MODEL_SELECTION_CASES, TOOL_CONFORMANCE_MATRIX } from "./conformance-matrix";

type ToolMetadata = Awaited<ReturnType<Client["listTools"]>>["tools"][number];

function sorted(values: readonly string[]): string[] {
  return [...values].sort();
}

function assertOutputSchema(tool: ToolMetadata): void {
  assert.ok(tool.outputSchema, `${tool.name} must declare outputSchema.`);
  const serialized = JSON.stringify(tool.outputSchema);
  for (const field of ["ok", "operation", "data", "warnings", "error", "retryable"]) {
    assert.match(serialized, new RegExp(`\\b${field}\\b`), `${tool.name} output schema must describe ${field}.`);
  }
}

async function testProtocolMetadata(): Promise<void> {
  const transport = new StdioClientTransport({
    command: "node",
    args: ["dist/index.js"],
    cwd: process.cwd(),
    env: { PATH: process.env.PATH ?? "" },
    stderr: "pipe",
  });
  const client = new Client({ name: "tripit-conformance", version: "0.2.4" });
  await client.connect(transport);

  try {
    assert.equal(client.getServerVersion()?.name, "tripit");
    assert.equal(client.getServerVersion()?.version, "0.2.4");
    assert.equal(client.getInstructions(), MCP_SERVER_INSTRUCTIONS);
    assert.ok(MCP_SERVER_INSTRUCTIONS.length <= 512, "Server instructions must keep core guidance in 512 characters.");

    const listed = await client.listTools();
    assert.deepEqual(sorted(listed.tools.map((tool) => tool.name)), sorted(ALL_TOOL_NAMES));
    assert.deepEqual(
      sorted(TOOL_CONFORMANCE_MATRIX.map((entry) => entry.name)),
      sorted(ALL_TOOL_NAMES),
      "Every registered tool must have one conformance-matrix row.",
    );

    const metadata = new Map(listed.tools.map((tool) => [tool.name, tool]));
    for (const testCase of TOOL_CONFORMANCE_MATRIX) {
      assert.ok(testCase.directPrompt.trim(), `${testCase.name} must have a direct-prompt conformance case.`);
      const tool = metadata.get(testCase.name);
      assert.ok(tool, `${testCase.name} must be registered.`);
      assert.match(tool.name, /^tripit_(list|get|create|update|delete|attach|remove|replace|assign|convert)_/);
      assert.ok(tool.title?.trim(), `${tool.name} must have a human-readable title.`);
      assert.ok(tool.description?.trim(), `${tool.name} must have a description.`);
      assert.ok(tool.inputSchema, `${tool.name} must have an input schema.`);
      assertOutputSchema(tool);
      assert.deepEqual(tool.annotations, toolAnnotations(testCase.behavior), `${tool.name} annotations must match its behavior.`);

      const invalid = await client.callTool({ name: testCase.name, arguments: testCase.invalidArgs });
      assert.equal(invalid.isError, true, `${tool.name} must reject its representative invalid input.`);
    }
  } finally {
    await client.close();
  }
}

async function testNormalizedEnvelopes(): Promise<void> {
  const success = successResult("test_success", { id: "123" });
  assert.deepEqual(success.structuredContent, {
    ok: true,
    operation: "test_success",
    data: { id: "123" },
    warnings: [],
  });
  assert.equal(normalizedToolOutputSchema.safeParse(success.structuredContent).success, true);

  const failure = errorResult("test_failure", { code: "TEST", message: "Nope", status: 429 });
  assert.equal(failure.isError, true);
  assert.deepEqual(failure.structuredContent, {
    ok: false,
    operation: "test_failure",
    error: { code: "TEST", message: "Nope", retryable: true, status: 429 },
    warnings: [],
  });
  assert.equal(normalizedToolOutputSchema.safeParse(failure.structuredContent).success, true);

  const embedded = await toolResult("test_embedded", async () => ({
    Error: { code: "400", message: "Payload rejected" },
    Warning: { code: "W1", message: "Check the date" },
  }));
  assert.equal(embedded.isError, true);
  assert.deepEqual(embedded.structuredContent, {
    ok: false,
    operation: "test_embedded",
    error: {
      code: "TRIPIT_RESPONSE_ERROR",
      message: "Payload rejected",
      retryable: false,
      status: 200,
    },
    warnings: [{ code: "W1", message: "Check the date" }],
  });
}

function testTypedItemSchema(): void {
  assert.equal(writableItemSchema.safeParse({ type: "weather", name: "Forecast" }).success, false);
  assert.equal(writableItemSchema.safeParse({ type: "car", data: { car_type: "SUV" } }).success, false);
  assert.equal(
    writableItemSchema.safeParse({
      type: "car",
      name: "Airport rental",
      pickupDate: "2026-09-17",
      pickupTime: "11:00",
      pickupTimezone: "America/Edmonton",
      dropoffDate: "2026-09-24",
      dropoffTime: "22:30",
      dropoffTimezone: "America/Edmonton",
      carType: "SUV",
    }).success,
    true,
  );
}

function testSelectionMatrix(): void {
  assert.equal(MODEL_SELECTION_CASES.filter((entry) => entry.kind === "positive").length, 5);
  assert.equal(MODEL_SELECTION_CASES.filter((entry) => entry.kind === "negative").length, 3);
  const modes = new Set(MODEL_SELECTION_CASES.map((entry) => entry.mode));
  const requiredModes = ["direct", "indirect", "follow_up", "write", "unsupported"] as const;
  for (const requiredMode of requiredModes) {
    assert.ok(modes.has(requiredMode), `Selection matrix must cover ${requiredMode}.`);
  }
  for (const entry of MODEL_SELECTION_CASES) {
    assert.ok(entry.prompt.trim());
    if (entry.expectedTool !== null) assert.ok(ALL_TOOL_NAMES.includes(entry.expectedTool));
  }
}

await testProtocolMetadata();
await testNormalizedEnvelopes();
testTypedItemSchema();
testSelectionMatrix();
console.log("OpenAI MCP conformance matrix passed for all registered tools.");
