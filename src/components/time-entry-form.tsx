"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";

const formSchema = z.object({
  projectId: z.string().min(1, "Selecione o projeto"),
  data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida"),
  mes: z.number().int().min(1).max(12),
  ano: z.number().int().min(2000).max(2100),
  inicio: z.string().regex(/^\d{2}:\d{2}$/, "Hora inválida"),
  fim: z.string().regex(/^\d{2}:\d{2}$/, "Hora inválida"),
  duracao: z.string().optional(),
  descricao: z.string().max(1000).optional(),
  costCenterId: z.string().min(1, "Selecione o centro de custo"),
  disciplineId: z.string().min(1, "Selecione a disciplina"),
  locationId: z.string().min(1, "Selecione o local"),
  horaExtra: z.boolean(),
});

type FormData = z.infer<typeof formSchema>;

export function TimeEntryForm({ initial, entryId }: { initial?: Partial<FormData>; entryId?: string }) {
  const router = useRouter();
  const [opcoes, setOpcoes] = useState<{
    projects: { id: string; nome: string }[];
    costCenters: { id: string; nome: string }[];
    disciplines: { id: string; nome: string }[];
    locations: { id: string; nome: string }[];
  }>({ projects: [], costCenters: [], disciplines: [], locations: [] });
  const [erro, setErro] = useState<string | null>(null);

  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { horaExtra: false as boolean, ...initial },
  });

  useEffect(() => {
    async function load() {
      const [projects, costCenters, disciplines, locations, myOptions] = await Promise.all([
        fetch("/api/projects?ativos=true").then((r) => r.json()).then((r) => r.data),
        fetch("/api/cost-centers?ativos=true").then((r) => r.json()).then((r) => r.data),
        fetch("/api/disciplines?ativos=true").then((r) => r.json()).then((r) => r.data),
        fetch("/api/locations?ativos=true").then((r) => r.json()).then((r) => r.data),
        fetch("/api/my-options").then((r) => r.json()).then((r) => r.data),
      ]);
      const { allowedOptions, allocatedProjectIds } = myOptions ?? { allowedOptions: [], allocatedProjectIds: [] };
      const allowedCcIds = allowedOptions.filter((o: { tipo: string }) => o.tipo === "CENTRO_CUSTO").map((o: { valorId: string }) => o.valorId);
      const allowedDiscIds = allowedOptions.filter((o: { tipo: string }) => o.tipo === "DISCIPLINA").map((o: { valorId: string }) => o.valorId);
      const allowedLocIds = allowedOptions.filter((o: { tipo: string }) => o.tipo === "LOCAL").map((o: { valorId: string }) => o.valorId);
      setOpcoes({
        projects: projects.filter((p: { id: string }) => allocatedProjectIds.includes(p.id)),
        costCenters: costCenters.filter((c: { id: string }) => allowedCcIds.includes(c.id)),
        disciplines: disciplines.filter((d: { id: string }) => allowedDiscIds.includes(d.id)),
        locations: locations.filter((l: { id: string }) => allowedLocIds.includes(l.id)),
      });
    }
    load();
  }, []);

  async function onSubmit(data: FormData) {
    setErro(null);
    const url = entryId ? `/api/time-entries/${entryId}` : "/api/time-entries";
    const method = entryId ? "PUT" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const body = await res.json();
    if (!res.ok) {
      setErro(body.error?.message ?? "Erro ao salvar");
      return;
    }
    router.push("/time-entries");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="data">Data</Label>
          <Input id="data" type="date" {...register("data")} />
          {errors.data && <p className="text-sm text-destructive">{errors.data.message}</p>}
        </div>
        <div className="space-y-1">
          <Label htmlFor="projectId">Projeto</Label>
          <select id="projectId" className="h-9 w-full rounded-lg border border-input bg-transparent px-3 py-1.5 text-sm focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50" {...register("projectId")}>
            <option value="">Selecione...</option>
            {opcoes.projects.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
          </select>
          {errors.projectId && <p className="text-sm text-destructive">{errors.projectId.message}</p>}
        </div>
        <div className="space-y-1">
          <Label htmlFor="inicio">Início</Label>
          <Input id="inicio" type="time" {...register("inicio")} />
          {errors.inicio && <p className="text-sm text-destructive">{errors.inicio.message}</p>}
        </div>
        <div className="space-y-1">
          <Label htmlFor="fim">Fim</Label>
          <Input id="fim" type="time" {...register("fim")} />
          {errors.fim && <p className="text-sm text-destructive">{errors.fim.message}</p>}
        </div>
        <div className="space-y-1">
          <Label htmlFor="mes">Mês (competência)</Label>
          <Input id="mes" type="number" {...register("mes", { valueAsNumber: true })} />
          {errors.mes && <p className="text-sm text-destructive">{errors.mes.message}</p>}
        </div>
        <div className="space-y-1">
          <Label htmlFor="ano">Ano (competência)</Label>
          <Input id="ano" type="number" {...register("ano", { valueAsNumber: true })} />
          {errors.ano && <p className="text-sm text-destructive">{errors.ano.message}</p>}
        </div>
        <div className="space-y-1">
          <Label htmlFor="costCenterId">Centro de custo</Label>
          <select id="costCenterId" className="h-9 w-full rounded-lg border border-input bg-transparent px-3 py-1.5 text-sm focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50" {...register("costCenterId")}>
            <option value="">Selecione...</option>
            {opcoes.costCenters.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
          </select>
          {errors.costCenterId && <p className="text-sm text-destructive">{errors.costCenterId.message}</p>}
        </div>
        <div className="space-y-1">
          <Label htmlFor="disciplineId">Disciplina</Label>
          <select id="disciplineId" className="h-9 w-full rounded-lg border border-input bg-transparent px-3 py-1.5 text-sm focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50" {...register("disciplineId")}>
            <option value="">Selecione...</option>
            {opcoes.disciplines.map((d) => <option key={d.id} value={d.id}>{d.nome}</option>)}
          </select>
          {errors.disciplineId && <p className="text-sm text-destructive">{errors.disciplineId.message}</p>}
        </div>
        <div className="space-y-1 md:col-span-2">
          <Label htmlFor="locationId">Local</Label>
          <select id="locationId" className="h-9 w-full rounded-lg border border-input bg-transparent px-3 py-1.5 text-sm focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50" {...register("locationId")}>
            <option value="">Selecione...</option>
            {opcoes.locations.map((l) => <option key={l.id} value={l.id}>{l.nome}</option>)}
          </select>
          {errors.locationId && <p className="text-sm text-destructive">{errors.locationId.message}</p>}
        </div>
        <div className="space-y-1 md:col-span-2">
          <Label htmlFor="descricao">Descrição</Label>
          <Textarea id="descricao" {...register("descricao")} />
          {errors.descricao && <p className="text-sm text-destructive">{errors.descricao.message}</p>}
        </div>
        <div className="flex items-center gap-2 md:col-span-2">
          <Checkbox id="horaExtra" checked={watch("horaExtra")} onCheckedChange={(v) => setValue("horaExtra", !!v)} />
          <Label htmlFor="horaExtra">Hora extra (informativo)</Label>
        </div>
      </div>
      {erro && <p className="text-sm text-destructive">{erro}</p>}
      <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Salvando..." : "Salvar apontamento"}</Button>
    </form>
  );
}
