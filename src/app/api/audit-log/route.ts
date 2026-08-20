import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { ok, fail } from "@/lib/api";
import { listAuditLog } from "@/services/reports";

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser();
    const page = Number(request.nextUrl.searchParams.get("page") ?? 1);
    const pageSize = Number(request.nextUrl.searchParams.get("pageSize") ?? 50);
    return ok(await listAuditLog(user, { page, pageSize }));
  } catch (error) {
    return fail(error);
  }
}
