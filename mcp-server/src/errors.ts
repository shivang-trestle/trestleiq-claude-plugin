export type TrestleErrorKind =
  | 'auth'
  | 'rate_limit'
  | 'invalid_input'
  | 'upstream'
  | 'network';

export class TrestleError extends Error {
  constructor(
    public readonly kind: TrestleErrorKind,
    message: string,
    public readonly http_status?: number,
  ) {
    super(message);
    this.name = 'TrestleError';
  }

  toContent() {
    return {
      kind: this.kind,
      message: this.message,
      http_status: this.http_status,
    };
  }
}
