import { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth";
import { ok, fail, parseBody } from "@/lib/api";
import { listUsers, createUser } from "@/services/users";
import { CreateUserSchema } from "@/schemas/users";

export async function GET() {
  try {
    await requireRole("ADMIN");
    return ok(await listUsers());
  } catch (error) {
    return fail(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireRole("ADMIN");
    const body = await parseBody(request, CreateUserSchema);
    return ok(await createUser(body), 201);
  } catch (error) {
    return fail(error);
  }
}
