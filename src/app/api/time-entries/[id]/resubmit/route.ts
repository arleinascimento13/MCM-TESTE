import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { ok, fail } from "@/lib/api";
import { resubmitTimeEntry } from "@/services/time-entries";

export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await params;
    return ok(await resubmitTimeEntry(user, id));
  } catch (error) {
    return fail(error);
  }
}
