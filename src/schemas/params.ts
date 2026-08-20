import { z } from "zod";

export const CreateParamSchema = z.object({ nome: z.string().min(1).max(255) });
export const UpdateParamSchema = z.object({
  nome: z.string().min(1).max(255).optional(),
  ativo: z.boolean().optional(),
});
