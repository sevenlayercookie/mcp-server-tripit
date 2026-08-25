import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import * as z from "zod/v4";
import { withTripIt } from "../client";
import { normalizedToolOutputSchema, toolResult } from "../results";
import { requireExactlyOneSelector, toolAnnotations } from "./common";

const objectTypeSchema = z.enum(["lodging", "activity", "air", "transport"]);

export function registerDocumentTools(server: McpServer): void {
  server.registerTool(
    "tripit_attach_document",
    {
      title: "Attach a TripIt document",
      description:
        "Attach an image or PDF available on the MCP server filesystem to a supported TripIt object. Type can be omitted for auto-detection.",
      inputSchema: {
        id: z.string().min(1).describe("Object UUID to attach to."),
        type: objectTypeSchema.optional().describe("TripIt object type. Optional; auto-detected when omitted."),
        file: z.string().min(1).describe("Path to a local image or PDF file."),
        caption: z.string().optional().describe("Optional caption for the attached document."),
        mimeType: z.string().optional().describe("Optional MIME type override."),
      },
      outputSchema: normalizedToolOutputSchema,
      annotations: toolAnnotations("write"),
    },
    async ({ id, type, file, caption, mimeType }) =>
      toolResult("tripit_attach_document", async () =>
        (await withTripIt((client) =>
          client.attachDocument({
            objectType: type,
            objectId: id,
            filePath: file,
            caption,
            mimeType,
          }),
        )) as Record<string, unknown>,
      ),
  );

  server.registerTool(
    "tripit_remove_document",
    {
      title: "Remove a TripIt document",
      description: "Permanently remove one or all documents from a supported TripIt object.",
      inputSchema: {
        id: z.string().min(1).describe("Object UUID to remove the document from."),
        type: objectTypeSchema.optional().describe("TripIt object type. Optional; auto-detected when omitted."),
        imageUuid: z.string().optional().describe("UUID of the image to remove."),
        imageUrl: z.string().optional().describe("URL of the image to remove."),
        caption: z.string().optional().describe("Caption of the image to remove."),
        index: z.number().int().positive().optional().describe("1-based image index to remove."),
        all: z.boolean().optional().describe("When true, remove all documents."),
      },
      outputSchema: normalizedToolOutputSchema,
      annotations: toolAnnotations("delete"),
    },
    async ({ id, type, imageUuid, imageUrl, caption, index, all }) => {
      requireExactlyOneSelector(
        [Boolean(imageUuid), Boolean(imageUrl), Boolean(caption), index !== undefined, Boolean(all)],
        "Provide exactly one selector: imageUuid, imageUrl, caption, index, or all.",
      );

      return toolResult("tripit_remove_document", async () =>
        (await withTripIt((client) =>
          client.removeDocument({
            objectType: type,
            objectId: id,
            imageUuid,
            imageUrl,
            caption,
            index,
            removeAll: all,
          }),
        )) as Record<string, unknown>,
      );
    },
  );
}
