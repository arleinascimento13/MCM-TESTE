import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { ok, fail, parseBody } from "@/lib/api";
import { rejectTimeEntry } from "@/services/time-entries";
import { RejectTimeEntrySchema } from "@/schemas/time-entry";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const body = await parseBody(request, RejectTimeEntrySchema);
    return ok(await rejectTimeEntry(user, id, body.motivo));
  } catch (error) {
    return fail(error);
  }
}
