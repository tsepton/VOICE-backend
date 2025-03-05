import { z } from "zod";


/// Messages sent by the client to the server
// TODO Rename !

export const StarePointSchema = z.object({
  x: z.number(),
  y: z.number(),
});

export const QuestionSchema = z.object({
  type: z.literal("question"),
  query: z.string().trim().min(1, { message: "Required" }),
  image: z.string().trim().min(1, { message: "Required" }),
  gaze: z.array(StarePointSchema),
});

export const MonitoringSchema = z.object({
  type: z.literal("monitoring"),
  data: z.string().trim().min(1, { message: "Required" }), // TODO: Define the monitoring data, see internal.ts
});

export const ToolCallResultSchema = z.object({
  type: z.literal("tool_call_result"),
  data: z.string().trim().min(1, { message: "Required" }), // TODO: Define the result data, see internal.ts
});

export const BaseMessageSchema = z.discriminatedUnion("type", [
  QuestionSchema,
  MonitoringSchema,
  ToolCallResultSchema
]);

export type StarePoint = z.infer<typeof StarePointSchema>;

export type Question = z.infer<typeof QuestionSchema>;

export type Monitoring = z.infer<typeof MonitoringSchema>;

export type ToolCallResult = z.infer<typeof ToolCallResultSchema>;

export type BaseMessage = z.infer<typeof BaseMessageSchema>;

/// Messages sent to the client by the server
// TODO Rename !

export interface Message {
  type: string;
}

export interface ConversationInfo extends Message {
  type: "info";
  uuid: string;
}

export interface Answer extends Message {
  type: "answer";
  text: string;
}

export interface ClientToolCall extends Message {
  type: "tool_call";
  id: string;
  name: string;
  args: Record<string, any>;
}