import { z } from "zod";

export const StarePointSchema = z.object({
  x: z.number(),
  y: z.number(),
});
export type StarePoint = z.infer<typeof StarePointSchema>;

export const QuestionSchema = z.object({
  query: z.string().trim().min(1, { message: "Required" }),
  image: z.string().trim().min(1, { message: "Required" }),
  gaze: z.array(StarePointSchema),
});

export type Question = z.infer<typeof QuestionSchema>;

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
