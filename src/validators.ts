import { Image, loadImage } from "canvas";
import { ZodSchema } from "zod";
import { Conversation, RemoteExecution } from "./domain.ts";
import {
  BadRequestError,
  ClientError,
  CommunicationError,
  UnprocessableContentError,
  UnsupportedMediaTypeError,
} from "./types/errors.ts";
import {
  IncomingMessage,
  IncomingMessageSchema,
  IncomingMessageType,
  MonitoringSchema,
  QuestionSchema,
  StarePoint,
  ToolCallResultSchema,
  ToolRegistrationSchema,
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
  ProcessedToolCallResult,
  ProcessedToolRegistration,
} from "./types/internal.ts";

export async function process(
  body: IncomingMessage
): Promise<Either<ClientError, ProcessedInput>> {
  const parsed = safeParse(IncomingMessageSchema, body);
  if (parsed.isLeft()) return parsed as Left<ClientError, any>;

  let operation = body.type;

  // FIXME : Could we depend on a generic type within the method signature ?
  switch (operation) {
    case IncomingMessageType.QUESTION:
      return await processQuestion(body);
    case IncomingMessageType.MONITORING:
      return await processMonitoringData(body);
    case IncomingMessageType.TOOL_CALL_RESULT:
      return await processToolCallResult(body);
    case IncomingMessageType.TOOL_REGISTRATION:
      return await processToolRegistration(body);
  }
}

async function processQuestion(
  body: IncomingMessage
): Promise<Either<ClientError, ProcessedQuestion>> {
  const parsed = safeParse(QuestionSchema, body);
  if (parsed.isLeft()) return parsed as Left<ClientError, any>;

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
  body: IncomingMessage
): Promise<Either<ClientError, ProcessedMonitoringData>> {
  const parsed = safeParse(MonitoringSchema, body);
  if (parsed.isLeft()) return parsed as Left<ClientError, any>;
  // TODO: Implementation
  return createRight({});
}

async function processToolCallResult(
  body: IncomingMessage
): Promise<Either<ClientError, ProcessedToolCallResult>> {
  const parsed = safeParse(ToolCallResultSchema, body);
  if (parsed.isLeft()) return parsed as Left<ClientError, any>;
  // TODO: Implementation
  return createRight({ id: "TODO", value: "TODO" });
}

async function processToolRegistration(
  body: IncomingMessage
): Promise<Either<ClientError, ProcessedToolRegistration>> {
  const parsed = safeParse(ToolRegistrationSchema, body);
  if (parsed.isLeft()) return parsed as Left<ClientError, any>;
  // TODO: Implementation

  const tools: ProcessedToolRegistration = parsed.value.data.map((tool) => ({
    name: tool.name,
    description: tool.description,
    args: tool.args,
  }));

  const names = tools.map((tool) => tool.name);
  const hasDuplicates = new Set(names).size !== names.length;
  if (hasDuplicates)
    return createLeft(
      new UnprocessableContentError("Multiple tools with same name.")
    );

  return createRight(tools);
}

function safeParse<T>(
  schema: ZodSchema<T>,
  body: unknown
): Either<ClientError, T> {
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
): Either<CommunicationError, Conversation> {
  if (!uuid) return createRight(Conversation.new(remoteExecution));
  else if (uuid.length > 0 && Conversation.exists(uuid))
    return createRight(Conversation.load(uuid, remoteExecution)!);
  else {
    return createLeft(new BadRequestError("Conversation does not exist."));
  }
}
