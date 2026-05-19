export class TrestleError extends Error {
    kind;
    http_status;
    constructor(kind, message, http_status) {
        super(message);
        this.kind = kind;
        this.http_status = http_status;
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
//# sourceMappingURL=errors.js.map