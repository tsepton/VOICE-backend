import { Image, loadImage } from "canvas";
import { ZodSchema } from "zod";
import { Conversation, RemoteExecution } from "./domain.ts";
import {
  BadRequestError,
  HttpClientError,
  UnprocessableContentError,
  UnsupportedMediaTypeError,
} from "./types/errors.ts";
import {
  BaseMessage,
  BaseMessageSchema,
  MonitoringSchema,
  QuestionSchema,
  StarePoint,
} from "./types/exposed.ts";
import {
  AggregatedStarePoint,
  createLeft,
  createRight,
  Either,
  Left,
  ProcessedInput,
  ProcessedMonitoringData,
  ProcessedQuestion,
} from "./types/internal.ts";

export async function process(
  body: BaseMessage
): Promise<Either<HttpClientError, ProcessedInput>> {
  const parsed = safeParse(BaseMessageSchema, body);
  if (parsed.isLeft()) return parsed as Left<HttpClientError, any>;

  let operation = body.type;

  switch (operation) {
    case "question":
      return await processQuestion(body);
    case "monitoring":
      return await processMonitoringData(body);
    case "tool_call_result":
      throw new Error("Not implemented yet TODO");
  }
}

async function processQuestion(
  body: BaseMessage
): Promise<Either<HttpClientError, ProcessedQuestion>> {
  const parsed = safeParse(QuestionSchema, body);
  if (parsed.isLeft()) return parsed as Left<HttpClientError, any>;

  const question = parsed.value;
  if (
    !question.image.startsWith("data:image/jpg;base64,") &&
    !question.image.startsWith("data:image/jpeg;base64,") &&
    !question.image.startsWith("data:image/png;base64,")
  )
    return createLeft(
      new UnsupportedMediaTypeError("Image format is neither jpg nor png.")
    );

  let image: Image;
  let gaze: AggregatedStarePoint[];

  try {
    image = await loadImage(question.image);
  } catch (e) {
    return createLeft(new UnprocessableContentError("Base64 is malformed."));
  }

  try {
    gaze = processGaze(question.gaze);
  } catch (e) {
    return createLeft(new UnprocessableContentError("Gaze is malformed."));
  }

  return createRight({
    query: question.query,
    image: image,
    gaze: gaze,
  });
}

async function processMonitoringData(
  body: BaseMessage
): Promise<Either<HttpClientError, ProcessedMonitoringData>> {
  const parsed = safeParse(MonitoringSchema, body);
  if (parsed.isLeft()) return parsed as Left<HttpClientError, any>;
  // TODO: Implementation
  return createRight({});
}

function safeParse<T>(
  schema: ZodSchema<T>,
  body: unknown
): Either<HttpClientError, T> {
  const parsedBody = schema.safeParse(body);
  if (!parsedBody.success)
    return createLeft(
      new BadRequestError("Invalid body data types.", parsedBody.error)
    );
  return createRight(parsedBody.data);
}

function processGaze(gaze: StarePoint[]): AggregatedStarePoint[] {
  // TODO
  return gaze.map((point) => ({
    x: point.x,
    y: point.y,
    value: 100,
    radius: 250,
  }));
}

export function retrieveConversation(
  uuid: string | undefined,
  remoteExecution: RemoteExecution
): Either<HttpClientError, Conversation> {
  if (!uuid) return createRight(Conversation.new(remoteExecution));
  else if (uuid.length > 0 && Conversation.exists(uuid))
    return createRight(Conversation.load(uuid, remoteExecution)!);
  else {
    return createLeft(new BadRequestError("Conversation does not exist."));
  }
}
