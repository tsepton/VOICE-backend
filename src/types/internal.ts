import { Image } from "canvas";

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