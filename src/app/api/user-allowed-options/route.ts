import { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth";
import { ok, fail, parseBody } from "@/lib/api";
import { listAllowedOptions, setAllowedOption } from "@/services/users";
import { CreateAllowedOptionSchema } from "@/schemas/allowed-options";

export async function GET() {
  try {
    await requireRole("ADMIN");
    return ok(await listAllowedOptions());
  } catch (error) {
    return fail(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireRole("ADMIN");
    const body = await parseBody(request, CreateAllowedOptionSchema);
    return ok(await setAllowedOption(body.userId, body.tipo, body.valorId), 201);
  } catch (error) {
    return fail(error);
  }
}
