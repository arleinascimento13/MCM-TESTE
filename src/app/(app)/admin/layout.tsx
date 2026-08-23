import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user || user.papel !== "ADMIN") redirect("/");
  return <div className="space-y-6">{children}</div>;
}
