export class ErrorCode {
  constructor(
    readonly code: number,
    readonly message: string,
  ) {}

  static of(code: number, message: string) {
    return new ErrorCode(code, message);
  }
}

export class Errs {
  static readonly SUCCESS = ErrorCode.of(0, 'success');
  static readonly NOT_FOUND = ErrorCode.of(404, 'not_found');
  static readonly MISSING_TOKEN = ErrorCode.of(401_01, 'token_missing');
  static readonly INVALID_TOKEN = ErrorCode.of(401_02, 'token_invalid');
  static readonly EXPIRED_TOKEN = ErrorCode.of(401_03, 'token_expired');

  static readonly MISSING_PARAMETER = ErrorCode.of(400_01, 'parameter_missing');
  static readonly INVALID_PARAMETER = ErrorCode.of(400_02, 'parameter_invalid');
  static readonly INVALID_ID = ErrorCode.of(400_03, 'invalid_id');
  static readonly DUPLICATED = ErrorCode.of(400_04, 'duplicated');
  static readonly NOT_SUPPORTED = ErrorCode.of(400_05, 'not_supported');
}
