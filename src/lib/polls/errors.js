export class PollError extends Error {
  constructor(message, { code = "POLL_ERROR", status = 400 } = {}) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

export class PollValidationError extends PollError {
  constructor(message) {
    super(message, {
      code: "INVALID_POLL_REQUEST",
      status: 400,
    });
  }
}

export class PollNotFoundError extends PollError {
  constructor() {
    super("The requested poll was not found.", {
      code: "POLL_NOT_FOUND",
      status: 404,
    });
  }
}

export class PollForbiddenError extends PollError {
  constructor() {
    super("Organizer access is required.", {
      code: "ORGANIZER_ACCESS_REQUIRED",
      status: 403,
    });
  }
}

export class PollConflictError extends PollError {
  constructor(message, code = "POLL_CONFLICT") {
    super(message, { code, status: 409 });
  }
}
