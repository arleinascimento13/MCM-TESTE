import { NextRequest } from "next/server";
import { requireUser, requireRole } from "@/lib/auth";
import { ok, fail, parseBody } from "@/lib/api";
import { listParams, createParam } from "@/services/params";
import { CreateParamSchema } from "@/schemas/params";

export async function GET(request: NextRequest) {
  try {
    await requireUser();
    const ativosOnly = request.nextUrl.searchParams.get("ativos") === "true";
    return ok(await listParams("location", ativosOnly));
  } catch (error) {
    return fail(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireRole("ADMIN");
    const body = await parseBody(request, CreateParamSchema);
    return ok(await createParam("location", body), 201);
  } catch (error) {
    return fail(error);
  }
}
