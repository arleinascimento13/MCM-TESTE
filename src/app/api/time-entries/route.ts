import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { ok, fail, parseBody } from "@/lib/api";
import { createTimeEntry, listTimeEntries } from "@/services/time-entries";
import { CreateTimeEntrySchema, ListTimeEntriesQuerySchema } from "@/schemas/time-entry";

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser();
    const query = ListTimeEntriesQuerySchema.parse(Object.fromEntries(request.nextUrl.searchParams));
    const result = await listTimeEntries(user, query);
    return ok(result);
  } catch (error) {
    return fail(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser();
    const body = await parseBody(request, CreateTimeEntrySchema);
    const entrada = await createTimeEntry(user, body);
    return ok(entrada, 201);
  } catch (error) {
    return fail(error);
  }
}
