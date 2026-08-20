import { ERROR_CODES, ErrorCode } from "./error-codes";

export class AppError extends Error {
  readonly code: ErrorCode;
  readonly statusCode: number;

  constructor(code: ErrorCode, message: string, statusCode: number) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.statusCode = statusCode;
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Não autenticado") {
    super(ERROR_CODES.UNAUTHORIZED, message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Sem permissão para esta ação") {
    super(ERROR_CODES.FORBIDDEN, message, 403);
  }
}

export class NotFoundError extends AppError {
  constructor(code: ErrorCode = ERROR_CODES.NOT_FOUND, message = "Recurso não encontrado") {
    super(code, message, 404);
  }
}

export class ConflictError extends AppError {
  constructor(code: ErrorCode = ERROR_CODES.CONFLICT, message = "Estado conflitante") {
    super(code, message, 409);
  }
}

export class ValidationError extends AppError {
  constructor(message = "Dados inválidos", code: ErrorCode = ERROR_CODES.VALIDATION_ERROR) {
    super(code, message, 400);
  }
}
