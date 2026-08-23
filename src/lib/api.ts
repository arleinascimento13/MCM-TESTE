import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { AppError } from "./errors";
import { ERROR_CODES } from "./error-codes";

export function ok(data: unknown, status = 200) {
  return NextResponse.json({ data }, { status });
}

export function fail(error: unknown) {
  if (error instanceof ZodError) {
    return NextResponse.json(
      { error: { code: ERROR_CODES.VALIDATION_ERROR, message: error.issues.map((i) => i.message).join("; ") } },
      { status: 400 }
    );
  }
  if (error instanceof AppError) {
    return NextResponse.json({ error: { code: error.code, message: error.message } }, { status: error.statusCode });
  }
  console.error(error);
  return NextResponse.json(
    { error: { code: ERROR_CODES.INTERNAL_ERROR, message: "Erro interno" } },
    { status: 500 }
  );
}

export async function parseBody<T>(request: Request, schema: { safeParse: (data: unknown) => { success: boolean; data?: T; error?: ZodError } }): Promise<T> {
  const body = await request.json().catch(() => null);
  const result = schema.safeParse(body);
  if (!result.success) throw result.error;
  return result.data as T;
}
