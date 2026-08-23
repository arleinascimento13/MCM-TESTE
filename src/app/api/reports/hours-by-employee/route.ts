import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { ok, fail } from "@/lib/api";
import { hoursByEmployee } from "@/services/reports";

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser();
    const params = Object.fromEntries(request.nextUrl.searchParams);
    const query = {
      mes: params.mes ? Number(params.mes) : undefined,
      ano: params.ano ? Number(params.ano) : undefined,
      projectId: params.projectId,
    };
    return ok(await hoursByEmployee(user, query));
  } catch (error) {
    return fail(error);
  }
}
