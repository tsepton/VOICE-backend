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

// TODO: determine Answer type
export interface Answer {}
