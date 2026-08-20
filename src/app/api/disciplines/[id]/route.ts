import { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth";
import { ok, fail, parseBody } from "@/lib/api";
import { updateParam, deactivateParam } from "@/services/params";
import { UpdateParamSchema } from "@/schemas/params";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireRole("ADMIN");
    const { id } = await params;
    const body = await parseBody(request, UpdateParamSchema);
    return ok(await updateParam("discipline", id, body));
  } catch (error) {
    return fail(error);
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireRole("ADMIN");
    const { id } = await params;
    return ok(await deactivateParam("discipline", id));
  } catch (error) {
    return fail(error);
  }
}
