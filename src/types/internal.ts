import { ToolCall } from "@langchain/core/messages/tool";
import { Image } from "canvas";
import {
  BaseClientError,
  BaseServerError,
  CommunicationError,
  InternalServerError,
} from "./errors.ts";

export type UUID = string;

export interface ProcessedInput {}

export interface AggregatedStarePoint extends ProcessedInput {
  x: number;
  y: number;
  radius: number;
  value: number;
}

export interface ProcessedQuestion extends ProcessedInput {
  query: string;
  image: Image;
  gaze: AggregatedStarePoint[];
}

export interface ProcessedMonitoringData extends ProcessedInput {
  // TODO: Define the monitoring data in accordance with the exposed schema
}

export interface ProcessedToolCallResult extends ProcessedInput {
  id: UUID;
  value: string;
}

export type ProcessedToolRegistration = (ToolCall & { description: string })[];

export abstract class Either<L, R> {
  abstract match<T>(onLeft: (left: L) => T, onRight: (right: R) => T): T;

  isLeft(): this is Left<L, R> {
    return this instanceof Left;
  }

  isRight(): this is Right<L, R> {
    return this instanceof Right;
  }

  get value(): R {
    return this.match(
      (left) => {
        throw left;
      },
      (right) => right
    );
  }

  get error(): L | undefined {
    return this.match(
      (left) => left,
      (_) => undefined
    );
  }
}

export class Left<L, R> extends Either<L, R> {
  constructor(public left: L) {
    super();
  }

  match<T>(onLeft: (left: L) => T, _: (right: R) => T): T {
    return onLeft(this.left);
  }

  get error(): L {
    return this.left;
  }
}

export class Right<L, R> extends Either<L, R> {
  constructor(public right: R) {
    super();
  }

  match<T>(_: (left: L) => T, onRight: (right: R) => T): T {
    return onRight(this.right);
  }

  get error(): undefined {
    return undefined;
  }
}

export function createLeft<L, R>(left: L): Either<L, R> {
  return new Left(left);
}

export function createRight<L, R>(right: R): Either<L, R> {
  return new Right(right);
}

export function tryCatch<T>(
  fn: () => T | Promise<T>
): Promise<Either<CommunicationError, T>>;

export async function tryCatch<R>(
  fn: () => Promise<R>
): Promise<Either<CommunicationError, R>> {
  try {
    const result = fn();

    if (result instanceof Promise) {
      return createRight(await result);
    } else return createRight(result);
  } catch (e: unknown) {
    console.error(e);
    if (e instanceof BaseClientError) return createLeft(e);
    if (e instanceof BaseServerError) return createLeft(e);
    else return createLeft(new InternalServerError("Something went wrong."));
  }
}
