import { Image } from "canvas";
import { InternalServerError } from "./errors.ts";

export interface AggregatedStarePoint {
  x: number;
  y: number;
  radius: number;
  value: number;
}

export interface ProcessedQuestion {
  query: string;
  image: Image;
  gaze: AggregatedStarePoint[];
}

// Base Either type
export abstract class Either<L, R> {
  abstract match<T>(onLeft: (left: L) => T, onRight: (right: R) => T): T;
}

// Left variant
export class Left<L, R> extends Either<L, R> {
  constructor(public left: L) {
    super();
  }

  match<T>(onLeft: (left: L) => T, _: (right: R) => T): T {
    return onLeft(this.left);
  }
}

// Right variant
export class Right<L, R> extends Either<L, R> {
  constructor(public right: R) {
    super();
  }

  match<T>(_: (left: L) => T, onRight: (right: R) => T): T {
    return onRight(this.right);
  }
}

export function createLeft<L, R>(left: L): Either<L, R> {
  return new Left(left);
}

export function createRight<L, R>(right: R): Either<L, R> {
  return new Right(right);
}

export function tryCatch<T>(fn: () => T | Promise<T>): Promise<Either<InternalServerError, T>>;
export async function tryCatch<R>(
  fn: () => Promise<R>,  // The function is now async
): Promise<Either<InternalServerError, R>> {
  try {
    const result = fn();  

    if (result instanceof Promise) {
      return createRight(await result);  // Return Right if successful
    } else return createRight(result);  // Return Right if successful
  } catch (e: unknown) {
    return createLeft(new InternalServerError("Something went wrong.", e));  // Return Left if error
  }
}