import { prisma } from "@/lib/prisma";

type ParamModel = "costCenter" | "discipline" | "location" | "project";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const models: Record<ParamModel, any> = {
  costCenter: prisma.costCenter,
  discipline: prisma.discipline,
  location: prisma.location,
  project: prisma.project,
};

export async function listParams(model: ParamModel, ativosOnly = false) {
  return models[model].findMany({
    where: ativosOnly ? { ativo: true } : undefined,
    orderBy: { nome: "asc" },
  });
}

export async function createParam(model: ParamModel, data: { nome: string }) {
  return models[model].create({ data });
}

export async function updateParam(model: ParamModel, id: string, data: { nome?: string; ativo?: boolean }) {
  return models[model].update({ where: { id }, data });
}

export async function deactivateParam(model: ParamModel, id: string) {
  return models[model].update({ where: { id }, data: { ativo: false } });
}
