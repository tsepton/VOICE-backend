// The API has been reworked to use websockets instead of HTTP requests
// Therefore, HTTP codes are legacy but won't be updated. 
// The errors are still relevant for the API's internal communication and error handling.

export type HttpError = {
  code: number;
  message: string;
};

// Errors 400
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

export class RequestTimeout extends BaseHttpClientError {
  code = 408;
}

export class UnsupportedMediaTypeError extends BaseHttpClientError {
  code = 415;
}

export class UnprocessableContentError extends BaseHttpClientError {
  code = 422;
}

// Errors 500
export interface HttpServerError extends HttpError {
  code: number;
}

abstract class BaseHttpServerError extends Error implements HttpClientError  {
  abstract code: number;
  constructor(public message: string, public info: any = undefined) {
    super();
  }
}

export class InternalServerError extends BaseHttpServerError {
  code = 500;
}