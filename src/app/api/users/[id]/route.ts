import { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth";
import { ok, fail, parseBody } from "@/lib/api";
import { updateUser, deactivateUser } from "@/services/users";
import { UpdateUserSchema } from "@/schemas/users";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireRole("ADMIN");
    const { id } = await params;
    const body = await parseBody(request, UpdateUserSchema);
    return ok(await updateUser(id, body));
  } catch (error) {
    return fail(error);
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireRole("ADMIN");
    const { id } = await params;
    return ok(await deactivateUser(id));
  } catch (error) {
    return fail(error);
  }
}
