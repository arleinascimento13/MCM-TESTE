import { z } from "zod";

export const CreateUserSchema = z.object({
  nome: z.string().min(1).max(255),
  email: z.string().email(),
  senha: z.string().min(6),
  papel: z.enum(["ADMIN", "JOB_LEADER", "FUNCIONARIO"]),
});

export const UpdateUserSchema = z.object({
  nome: z.string().min(1).max(255).optional(),
  email: z.string().email().optional(),
  senha: z.string().min(6).optional(),
  papel: z.enum(["ADMIN", "JOB_LEADER", "FUNCIONARIO"]).optional(),
  ativo: z.boolean().optional(),
});
