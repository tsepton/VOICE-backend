import { z } from "zod";


/// Messages sent by the client to the server
export enum IncomingMessageType {
  QUESTION = "question",
  MONITORING = "monitoring",
  TOOL_CALL_RESULT = "tool_call_result",
}

export const StarePointSchema = z.object({
  x: z.number(),
  y: z.number(),
});

export const QuestionSchema = z.object({
  type: z.literal(IncomingMessageType.QUESTION),
  query: z.string().trim().min(1, { message: "Required" }),
  image: z.string().trim().min(1, { message: "Required" }),
  gaze: z.array(StarePointSchema),
});

export const MonitoringSchema = z.object({
  type: z.literal(IncomingMessageType.MONITORING),
  data: z.string().trim().min(1, { message: "Required" }), // TODO: Define the monitoring data, see internal.ts
});

export const ToolCallResultSchema = z.object({
  type: z.literal(IncomingMessageType.TOOL_CALL_RESULT),
  data: z.string().trim().min(1, { message: "Required" }), // TODO: Define the result data, see internal.ts
});

export const IncomingMessageSchema = z.discriminatedUnion("type", [
  QuestionSchema,
  MonitoringSchema,
  ToolCallResultSchema
]);

export type StarePoint = z.infer<typeof StarePointSchema>;

export type Question = z.infer<typeof QuestionSchema>;

export type Monitoring = z.infer<typeof MonitoringSchema>;

export type ToolCallResult = z.infer<typeof ToolCallResultSchema>;

export type IncomingMessage = z.infer<typeof IncomingMessageSchema>;


/// Messages sent to the client by the server
export interface OutgoingMessage {
  type: string;
}

export interface ConversationInfo extends OutgoingMessage {
  type: "info";
  uuid: string;
}

export interface Answer extends OutgoingMessage {
  type: "answer";
  text: string;
}

export interface ClientToolCall extends OutgoingMessage {
  type: "tool_call";
  id: string;
  name: string;
  args: Record<string, any>;
}