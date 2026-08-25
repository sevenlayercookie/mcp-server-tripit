import type { ToolAnnotations } from "@modelcontextprotocol/sdk/types.js";

export function requireExactlyOneSelector(selectors: Array<boolean>, message: string): void {
  const count = selectors.filter(Boolean).length;
  if (count !== 1) {
    throw new Error(message);
  }
}

export type ToolBehavior = "read" | "create" | "update" | "delete" | "write" | "destructive-write";

export function toolAnnotations(behavior: ToolBehavior): ToolAnnotations {
  const readOnly = behavior === "read";
  const destructive = behavior === "update" || behavior === "delete" || behavior === "destructive-write";
  const idempotent = behavior === "read" || behavior === "update";

  return {
    readOnlyHint: readOnly,
    destructiveHint: destructive,
    openWorldHint: false,
    idempotentHint: idempotent,
  };
}
