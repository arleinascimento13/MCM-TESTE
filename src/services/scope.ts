import type { SessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ForbiddenError } from "@/lib/errors";

export async function getTeamMemberIds(jobLeaderId: string): Promise<string[]> {
  const vinculos = await prisma.jobLeaderAssignment.findMany({
    where: { jobLeaderId, ativo: true },
    select: { funcionarioId: true },
  });
  return vinculos.map((v) => v.funcionarioId);
}

export async function scopeFilter(user: SessionUser): Promise<{ funcionarioId?: string | { in: string[] } }> {
  switch (user.papel) {
    case "ADMIN":
      return {};
    case "JOB_LEADER": {
      const teamIds = await getTeamMemberIds(user.id);
      return { funcionarioId: { in: teamIds } };
    }
    case "FUNCIONARIO":
      return { funcionarioId: user.id };
    default:
      throw new ForbiddenError("Papel desconhecido");
  }
}
