import { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth";
import { ok, fail, parseBody } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { CreateAllocationSchema } from "@/schemas/allocations";

export async function GET() {
  try {
    await requireRole("ADMIN");
    return ok(await prisma.allocation.findMany({
      include: { funcionario: { select: { nome: true } }, project: { select: { nome: true } } },
      orderBy: { criadoEm: "desc" },
    }));
  } catch (error) {
    return fail(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireRole("ADMIN");
    const body = await parseBody(request, CreateAllocationSchema);
    return ok(await prisma.allocation.create({ data: body }), 201);
  } catch (error) {
    return fail(error);
  }
}
