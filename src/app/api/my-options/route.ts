import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { ok, fail } from "@/lib/api";
import { getMyOptions } from "@/services/users";

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser();
    return ok(await getMyOptions(user));
  } catch (error) {
    return fail(error);
  }
}
