// The API has been reworked to use websockets instead of HTTP requests
// Therefore, codes are derived from HTTP documentation but newer may also differ. 
// There is no guarantee that the error codes are the same as the HTTP codes.

export interface CommunicationError extends Error {
  code: number;
  message: string;
};

// Errors emanating from the client side
export interface ClientError extends CommunicationError {
  code: number;
}

export abstract class BaseClientError implements ClientError {
  abstract code: number;
  abstract name: string;

  constructor(public message: string, public info: any = undefined) {}
}

export class BadRequestError extends BaseClientError {
  code = 400;
  name = "Bad Request";
}

export class RequestTimeout extends BaseClientError {
  code = 408;
  name = "Request Timeout";
}

export class UnsupportedMediaTypeError extends BaseClientError {
  code = 415;
  name = "Unsupported Media Type";
}

export class UnprocessableContentError extends BaseClientError {
  code = 422;
  name = "Unprocessable Content";
}

// Errors emanating from the server side
export interface ServerError extends CommunicationError {
  code: number;
}

export abstract class BaseServerError implements ServerError  {
  abstract code: number;
  public name = "Internal Server Error";
  constructor(public message: string, public info: any = undefined) {}
}

export class InternalServerError extends BaseServerError {
  code = 500;
}