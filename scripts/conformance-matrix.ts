import type { TripItToolName } from "../src/types";
import type { ToolBehavior } from "../src/tools/common";

export type ToolConformanceCase = {
  name: TripItToolName;
  behavior: ToolBehavior;
  directPrompt: string;
  invalidArgs: Record<string, unknown>;
};

export const TOOL_CONFORMANCE_MATRIX: readonly ToolConformanceCase[] = [
  { name: "tripit_list_trips", behavior: "read", directPrompt: "List my upcoming TripIt trips.", invalidArgs: { pageSize: 0 } },
  { name: "tripit_get_trip", behavior: "read", directPrompt: "Get TripIt trip 123.", invalidArgs: {} },
  { name: "tripit_create_trip", behavior: "create", directPrompt: "Create a TripIt trip to Calgary.", invalidArgs: {} },
  { name: "tripit_update_trip", behavior: "update", directPrompt: "Update TripIt trip 123.", invalidArgs: {} },
  { name: "tripit_delete_trip", behavior: "delete", directPrompt: "Delete TripIt trip 123.", invalidArgs: {} },
  { name: "tripit_get_lodging", behavior: "read", directPrompt: "Get lodging reservation 123.", invalidArgs: {} },
  { name: "tripit_create_lodging", behavior: "create", directPrompt: "Add this hotel to my Calgary trip.", invalidArgs: {} },
  { name: "tripit_update_lodging", behavior: "update", directPrompt: "Update lodging reservation 123.", invalidArgs: {} },
  { name: "tripit_delete_lodging", behavior: "delete", directPrompt: "Delete lodging reservation 123.", invalidArgs: {} },
  { name: "tripit_attach_lodging_document", behavior: "write", directPrompt: "Attach this PDF to lodging 123.", invalidArgs: {} },
  { name: "tripit_remove_lodging_document", behavior: "delete", directPrompt: "Remove the receipt from lodging 123.", invalidArgs: {} },
  { name: "tripit_get_flight", behavior: "read", directPrompt: "Get flight reservation 123.", invalidArgs: {} },
  { name: "tripit_create_flight", behavior: "create", directPrompt: "Add this flight to my Calgary trip.", invalidArgs: {} },
  { name: "tripit_update_flight", behavior: "update", directPrompt: "Update flight reservation 123.", invalidArgs: {} },
  { name: "tripit_delete_flight", behavior: "delete", directPrompt: "Delete flight reservation 123.", invalidArgs: {} },
  { name: "tripit_get_transport", behavior: "read", directPrompt: "Get transport item 123.", invalidArgs: {} },
  { name: "tripit_create_transport", behavior: "create", directPrompt: "Add this transfer to my Calgary trip.", invalidArgs: {} },
  { name: "tripit_update_transport", behavior: "update", directPrompt: "Update transport item 123.", invalidArgs: {} },
  { name: "tripit_delete_transport", behavior: "delete", directPrompt: "Delete transport item 123.", invalidArgs: {} },
  { name: "tripit_get_activity", behavior: "read", directPrompt: "Get activity 123.", invalidArgs: {} },
  { name: "tripit_create_activity", behavior: "create", directPrompt: "Add this museum visit to my Calgary trip.", invalidArgs: {} },
  { name: "tripit_update_activity", behavior: "update", directPrompt: "Update activity 123.", invalidArgs: {} },
  { name: "tripit_delete_activity", behavior: "delete", directPrompt: "Delete activity 123.", invalidArgs: {} },
  { name: "tripit_attach_document", behavior: "write", directPrompt: "Attach this PDF to TripIt item 123.", invalidArgs: {} },
  { name: "tripit_remove_document", behavior: "delete", directPrompt: "Remove a document from TripIt item 123.", invalidArgs: {} },
  { name: "tripit_create_trip_item", behavior: "create", directPrompt: "Create this car rental directly in my Calgary trip.", invalidArgs: {} },
  { name: "tripit_list_unfiled_items", behavior: "read", directPrompt: "List my unfiled TripIt items.", invalidArgs: { pageSize: 0 } },
  { name: "tripit_get_unfiled_item", behavior: "read", directPrompt: "Get unfiled note 123.", invalidArgs: {} },
  { name: "tripit_create_item_without_trip", behavior: "create", directPrompt: "Create this note without choosing a trip.", invalidArgs: {} },
  { name: "tripit_replace_unfiled_item", behavior: "update", directPrompt: "Replace unfiled car item 123.", invalidArgs: {} },
  { name: "tripit_assign_unfiled_item", behavior: "write", directPrompt: "Assign unfiled note 123 to trip 456.", invalidArgs: {} },
  { name: "tripit_convert_unfiled_item", behavior: "destructive-write", directPrompt: "Convert unfiled note 123 into lodging in trip 456.", invalidArgs: {} },
  { name: "tripit_delete_unfiled_item", behavior: "delete", directPrompt: "Delete unfiled note 123.", invalidArgs: {} },
] as const;

export const MODEL_SELECTION_CASES = [
  { kind: "positive", mode: "direct", prompt: "What trips do I have coming up?", expectedTool: "tripit_list_trips" },
  { kind: "positive", mode: "indirect", prompt: "Put this raw Airbnb confirmation into the right trip as lodging.", expectedTool: "tripit_convert_unfiled_item" },
  { kind: "positive", mode: "write", prompt: "File that unfiled car rental in the Calgary trip without changing it.", expectedTool: "tripit_assign_unfiled_item" },
  { kind: "positive", mode: "follow_up", prompt: "Now remove the activity we just inspected.", expectedTool: "tripit_delete_activity" },
  { kind: "positive", mode: "write", prompt: "Save these entry instructions without associating them with a trip.", expectedTool: "tripit_create_item_without_trip" },
  { kind: "negative", mode: "unsupported", prompt: "What is the weather in Calgary tomorrow?", expectedTool: null },
  { kind: "negative", mode: "unsupported", prompt: "Send my itinerary to everyone in my contacts.", expectedTool: null },
  { kind: "negative", mode: "unsupported", prompt: "Book and pay for the cheapest flight you can find.", expectedTool: null },
] as const;
