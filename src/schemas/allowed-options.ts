import { z } from "zod";

export const CreateAllowedOptionSchema = z.object({
  userId: z.string().uuid(),
  tipo: z.enum(["DISCIPLINA", "CENTRO_CUSTO", "LOCAL"]),
  valorId: z.string().uuid(),
});
