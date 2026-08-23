import { ParamManager } from "@/components/param-manager";
import { PageHeader } from "@/components/layout/page-header";

export default function ProjectsPage() {
  return (
    <>
      <PageHeader title="Projetos" subtitle="Cadastre e gerencie os projetos" />
      <main className="p-4 sm:p-6">
        <ParamManager resource="projects" />
      </main>
    </>
  );
}
