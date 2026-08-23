import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";

const links = [
  { href: "/admin/cost-centers", label: "Centros de custo" },
  { href: "/admin/disciplines", label: "Disciplinas" },
  { href: "/admin/locations", label: "Locais" },
  { href: "/admin/projects", label: "Projetos" },
  { href: "/admin/usuarios", label: "Usuários" },
  { href: "/admin/vinculos", label: "Job leaders" },
  { href: "/admin/opcoes", label: "Opções permitidas" },
];

export default function AdminPage() {
  return (
    <>
      <PageHeader
        title="Cadastros"
        subtitle="Gerencie centros de custo, disciplinas, locais, projetos e alocações"
      />
      <main className="p-4 sm:p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {links.map((l) => (
            <Link key={l.href} href={l.href}>
              <Card className="transition-colors hover:bg-muted/50">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between text-sm font-medium">
                    {l.label}
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  Gerenciar {l.label.toLowerCase()}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </main>
    </>
  );
}
