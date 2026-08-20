import { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth";
import { ok, fail } from "@/lib/api";
import { deactivateAssignment } from "@/services/users";

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireRole("ADMIN");
    const { id } = await params;
    return ok(await deactivateAssignment(id));
  } catch (error) {
    return fail(error);
  }
}
