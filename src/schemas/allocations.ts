import { z } from "zod";

export const CreateAllocationSchema = z.object({
  funcionarioId: z.string().uuid(),
  projectId: z.string().uuid(),
});
