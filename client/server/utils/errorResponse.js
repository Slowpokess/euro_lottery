/**
 * Enhanced error handling class
 * Supports both English and localized error messages
 */
class ErrorResponse extends Error {
  constructor(message, statusCode, localizedMessage = null) {
    super(message);
    this.statusCode = statusCode;
    // Store localized message separately
    this.localizedMessage = localizedMessage;
    // Include error name for better debugging
    this.name = this.constructor.name;
    // Capture stack trace
    Error.captureStackTrace(this, this.constructor);
  }

  // Validate and format error object for API response
  toJSON() {
    return {
      success: false,
      error: this.message,
      localizedError: this.localizedMessage,
      status: this.statusCode,
      // Don't include stack trace in production
      ...(process.env.NODE_ENV === 'development' && { stack: this.stack })
    };
  }
}

// Custom error types for specific scenarios
ErrorResponse.notFound = (resource = 'Resource', message = null) => {
  return new ErrorResponse(
    message || `${resource} not found`,
    404,
    `${resource} не найден`
  );
};

ErrorResponse.unauthorized = (message = null) => {
  return new ErrorResponse(
    message || 'Unauthorized access',
    401,
    'Нет доступа'
  );
};

ErrorResponse.forbidden = (message = null) => {
  return new ErrorResponse(
    message || 'Forbidden access',
    403,
    'Доступ запрещен'
  );
};

ErrorResponse.badRequest = (message = null) => {
  return new ErrorResponse(
    message || 'Invalid request data',
    400,
    'Некорректные данные запроса'
  );
};

module.exports = ErrorResponse;