import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      nome: string;
      email: string;
      papel: "ADMIN" | "JOB_LEADER" | "FUNCIONARIO";
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    nome: string;
    email: string;
    papel: "ADMIN" | "JOB_LEADER" | "FUNCIONARIO";
  }
}
