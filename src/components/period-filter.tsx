"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

export function PeriodFilter() {
  const router = useRouter();
  const params = useSearchParams();

  function apply() {
    const mes = (document.getElementById("mes") as HTMLInputElement)?.value;
    const ano = (document.getElementById("ano") as HTMLInputElement)?.value;
    const sp = new URLSearchParams();
    if (mes) sp.set("mes", mes);
    if (ano) sp.set("ano", ano);
    router.push(`/reports?${sp.toString()}`);
  }

  return (
    <div className="flex items-end gap-3">
      <div className="space-y-1">
        <Label htmlFor="mes">Mês</Label>
        <Input id="mes" type="number" min={1} max={12} defaultValue={params.get("mes") ?? ""} placeholder="Mês" />
      </div>
      <div className="space-y-1">
        <Label htmlFor="ano">Ano</Label>
        <Input id="ano" type="number" min={2000} max={2100} defaultValue={params.get("ano") ?? ""} placeholder="Ano" />
      </div>
      <button type="button" className="rounded-sm bg-primary px-4 py-2 text-sm text-white" onClick={apply}>
        Filtrar
      </button>
    </div>
  );
}
