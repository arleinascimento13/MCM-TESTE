import { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth";
import { ok, fail } from "@/lib/api";
import { prisma } from "@/lib/prisma";

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireRole("ADMIN");
    const { id } = await params;
    return ok(await prisma.allocation.delete({ where: { id } }));
  } catch (error) {
    return fail(error);
  }
}
