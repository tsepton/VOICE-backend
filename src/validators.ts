import { Image, loadImage } from "canvas";
import { Request } from "express";
import {
    BadRequestError,
    HttpClientError,
    UnprocessableContentError,
    UnsupportedMediaTypeError,
} from "./types/errors.ts";
import { Question, QuestionSchema, StarePoint } from "./types/exposed.ts";
import {
    AggregatedStarePoint,
    createLeft,
    createRight,
    Either,
    ProcessedQuestion,
} from "./types/internal.ts";

export async function process(
  req: Request<Question>
): Promise<Either<HttpClientError, ProcessedQuestion>> {

    console.log(req.body);
    
  const parsedBody = QuestionSchema.safeParse(req.body);
  if (!parsedBody.success)
    return createLeft(
      new BadRequestError("Invalid body data types.", parsedBody.error)
    );

  const question = parsedBody.data;

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

function processGaze(gaze: StarePoint[]): AggregatedStarePoint[] {
  // TODO
  return gaze.map((point) => ({
    x: point.x,
    y: point.y,
    value: 4,
    radius: 25,
  }));
}
