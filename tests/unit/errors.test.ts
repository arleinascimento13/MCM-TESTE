import { describe, it, expect } from "vitest";
import { AppError, NotFoundError, ConflictError, ValidationError, ForbiddenError, UnauthorizedError } from "@/lib/errors";
import { ERROR_CODES } from "@/lib/error-codes";

describe("errors", () => {
  it("AppError expõe code e statusCode", () => {
    const e = new AppError("MEU_CODIGO", "mensagem", 400);
    expect(e.code).toBe("MEU_CODIGO");
    expect(e.message).toBe("mensagem");
    expect(e.statusCode).toBe(400);
  });

  it("NotFoundError usa 404", () => {
    expect(new NotFoundError(ERROR_CODES.NOT_FOUND, "não existe").statusCode).toBe(404);
  });

  it("erros comuns herdam de AppError", () => {
    for (const E of [UnauthorizedError, ForbiddenError, ConflictError, ValidationError]) {
      expect(new E("X", "y") instanceof AppError).toBe(true);
    }
  });
});
