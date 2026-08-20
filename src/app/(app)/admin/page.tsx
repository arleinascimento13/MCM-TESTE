import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {links.map((l) => (
        <Link key={l.href} href={l.href}>
          <Card className="transition-colors hover:bg-muted">
            <CardHeader><CardTitle className="text-sm font-medium">{l.label}</CardTitle></CardHeader>
            <CardContent className="text-sm text-muted-foreground">Gerenciar {l.label.toLowerCase()}</CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
