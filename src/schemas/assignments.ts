import { z } from "zod";

export const CreateAssignmentSchema = z.object({
  funcionarioId: z.string().uuid(),
  jobLeaderId: z.string().uuid(),
});
