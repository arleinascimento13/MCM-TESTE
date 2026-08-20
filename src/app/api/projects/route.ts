import { NextRequest } from "next/server";
import { requireUser, requireRole } from "@/lib/auth";
import { ok, fail, parseBody } from "@/lib/api";
import { listParams, createParam } from "@/services/params";
import { CreateParamSchema } from "@/schemas/params";

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser();
    const ativosOnly = user.papel === "ADMIN" ? request.nextUrl.searchParams.get("ativos") === "true" : true;
    return ok(await listParams("project", ativosOnly));
  } catch (error) {
    return fail(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireRole("ADMIN");
    const body = await parseBody(request, CreateParamSchema);
    return ok(await createParam("project", body), 201);
  } catch (error) {
    return fail(error);
  }
}
