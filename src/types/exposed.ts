import { z } from "zod";

export const StarePointSchema = z.object({
  x: z.number(),
  y: z.number(),
});
export type StarePoint = z.infer<typeof StarePointSchema>;

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

export const BaseMessageSchema = z.discriminatedUnion("type", [
  QuestionSchema,
  MonitoringSchema,
]);

export type Question = z.infer<typeof QuestionSchema>;

export type Monitoring = z.infer<typeof MonitoringSchema>;

export type BaseMessage = z.infer<typeof BaseMessageSchema>;

export interface Message {
  type: string;
}

export interface ConversationInfo extends Message {
  type: "info";
  uuid: string;
}

export interface Answer extends Message{
  type: "answer";
  text: string;
}
