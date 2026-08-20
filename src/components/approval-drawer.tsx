"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function ApprovalDrawer({ entryId, onDone }: { entryId: string; onDone?: () => void }) {
  const router = useRouter();
  const [modo, setModo] = useState<"aprovacao" | "rejeicao" | null>(null);
  const [motivo, setMotivo] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  async function executar() {
    setErro(null);
    if (modo === "rejeicao" && motivo.trim().length < 3) {
      setErro("Motivo da rejeição é obrigatório");
      return;
    }
    setCarregando(true);
    const url = `/api/time-entries/${entryId}/${modo}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ motivo }),
    });
    const body = await res.json();
    if (!res.ok) {
      setErro(body.error?.message ?? "Erro ao processar");
      setCarregando(false);
      return;
    }
    router.refresh();
    onDone?.();
  }

  return (
    <div className="flex items-center gap-2">
      <Button size="sm" variant="outline" onClick={() => setModo(modo === "aprovacao" ? null : "aprovacao")}>
        {modo === "aprovacao" ? "Cancelar" : "Aprovar"}
      </Button>
      <Button size="sm" variant="outline" onClick={() => setModo(modo === "rejeicao" ? null : "rejeicao")}>
        {modo === "rejeicao" ? "Cancelar" : "Rejeitar"}
      </Button>
      {modo === "rejeicao" && (
        <div className="flex items-center gap-2">
          <Label htmlFor="motivo">Motivo</Label>
          <Textarea id="motivo" value={motivo} onChange={(e) => setMotivo(e.target.value)} className="w-64" />
        </div>
      )}
      {modo && (
        <Button size="sm" disabled={carregando} onClick={executar}>
          {carregando ? "Processando..." : "Confirmar"}
        </Button>
      )}
      {erro && <p className="text-sm text-destructive">{erro}</p>}
    </div>
  );
}
