import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { SidebarProvider } from "@/components/layout/sidebar-context";
import { Sidebar } from "@/components/layout/sidebar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  return (
    <SidebarProvider>
      <Sidebar user={{ nome: user.nome, papel: user.papel }} />
      <div className="min-h-dvh lg:pl-64">{children}</div>
    </SidebarProvider>
  );
}
