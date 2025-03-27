import { ErrorCode, Errs } from '../error-codes';

type ErrorArgs = ({ [k: string]: any } | string)[] | { [k: string]: any };

export class UserFacingError extends Error {
  status: number = 400;
  code: number = 400;
  args?: ErrorArgs;

  constructor(message: string, args?: ErrorArgs) {
    super(message);
    this.args = args;
  }
}

export class BadRequestException extends UserFacingError {
  constructor(code: ErrorCode, args?: ErrorArgs) {
    super(code.message);
    this.code = code.code;
    this.args = args;
  }
}

export class InvalidParameterException extends BadRequestException {
  constructor(field: string) {
    super(Errs.INVALID_PARAMETER);
    this.args = { field };
  }
}

export class UnauthorizedException extends UserFacingError {
  constructor(code: ErrorCode) {
    super(code.message);
    this.status = 401;
    this.code = code.code;
  }
}

export class InternalError extends Error {
  status: number = 500;
  code: number = 500;

  constructor(message?: string, code?: number) {
    super(message || 'internal_error');
    if (code) {
      this.code = code;
    }
  }
}
