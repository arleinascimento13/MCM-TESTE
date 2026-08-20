import { z } from "zod";

export const CreateTimeEntrySchema = z.object({
  projectId: z.string().uuid(),
  data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida"),
  mes: z.number().int().min(1).max(12),
  ano: z.number().int().min(2000).max(2100),
  inicio: z.string().regex(/^\d{2}:\d{2}$/, "Hora de início inválida"),
  fim: z.string().regex(/^\d{2}:\d{2}$/, "Hora de fim inválida"),
  duracao: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
  descricao: z.string().max(1000).optional(),
  costCenterId: z.string().uuid(),
  disciplineId: z.string().uuid(),
  locationId: z.string().uuid(),
  horaExtra: z.boolean().default(false),
});

export const UpdateTimeEntrySchema = CreateTimeEntrySchema.partial();

export const RejectTimeEntrySchema = z.object({
  motivo: z.string().min(3, "Motivo da rejeição é obrigatório"),
});

export const ListTimeEntriesQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().max(100).optional(),
  mes: z.coerce.number().int().min(1).max(12).optional(),
  ano: z.coerce.number().int().min(2000).max(2100).optional(),
  projectId: z.string().uuid().optional(),
  status: z.enum(["PENDENTE", "APROVADA", "REJEITADA"]).optional(),
  costCenterId: z.string().uuid().optional(),
  disciplineId: z.string().uuid().optional(),
});
