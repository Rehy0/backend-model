class ApiError extends Error {
  constructor(
    statusCode,
    message = "Something went wrong!!",
    errors = [],
    success = false, // ✅ yeh parameter add karna zaruri hai
    stack = ""
  ) {
    super(message);
    this.statusCode = statusCode;
    this.data = null;
    this.message = message;
    this.success = success; // ✅ ab ye variable define hai
    this.errors = errors;

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export { ApiError }; ;
 