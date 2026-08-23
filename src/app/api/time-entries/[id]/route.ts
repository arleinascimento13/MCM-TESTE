import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { ok, fail, parseBody } from "@/lib/api";
import { getTimeEntry, updateTimeEntry, softDeleteTimeEntry } from "@/services/time-entries";
import { UpdateTimeEntrySchema } from "@/schemas/time-entry";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await params;
    return ok(await getTimeEntry(user, id));
  } catch (error) {
    return fail(error);
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const body = await parseBody(request, UpdateTimeEntrySchema);
    return ok(await updateTimeEntry(user, id, body));
  } catch (error) {
    return fail(error);
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await params;
    return ok(await softDeleteTimeEntry(user, id));
  } catch (error) {
    return fail(error);
  }
}
