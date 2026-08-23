import { auth } from "@/auth";
import { UnauthorizedError, ForbiddenError } from "./errors";

export type SessionUser = {
  id: string;
  nome: string;
  email: string;
  papel: "ADMIN" | "JOB_LEADER" | "FUNCIONARIO";
};

export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await auth();
  if (!session?.user?.id) return null;
  return {
    id: session.user.id as string,
    nome: session.user.nome as string,
    email: session.user.email as string,
    papel: session.user.papel as SessionUser["papel"],
  };
}

export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) throw new UnauthorizedError();
  return user;
}

export async function requireRole(...papeis: SessionUser["papel"][]): Promise<SessionUser> {
  const user = await requireUser();
  if (!papeis.includes(user.papel)) throw new ForbiddenError();
  return user;
}
