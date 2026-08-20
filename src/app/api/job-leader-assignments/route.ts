import { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth";
import { ok, fail, parseBody } from "@/lib/api";
import { listAssignments, createAssignment } from "@/services/users";
import { CreateAssignmentSchema } from "@/schemas/assignments";

export async function GET() {
  try {
    await requireRole("ADMIN");
    return ok(await listAssignments());
  } catch (error) {
    return fail(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireRole("ADMIN");
    const body = await parseBody(request, CreateAssignmentSchema);
    return ok(await createAssignment(body.funcionarioId, body.jobLeaderId), 201);
  } catch (error) {
    return fail(error);
  }
}
