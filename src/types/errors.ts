export type HttpError = {
  code: number;
  message: string;
};

export interface HttpClientError extends HttpError {
  code: number;
}

abstract class BaseHttpClientError implements HttpClientError {
  abstract code: number;
  constructor(public message: string, public info: any = undefined) {}
}

export class BadRequestError extends BaseHttpClientError {
  code = 400;
}

export class UnsupportedMediaTypeError extends BaseHttpClientError {
  code = 415;
}

export class UnprocessableContentError extends BaseHttpClientError {
  code = 422;
}
