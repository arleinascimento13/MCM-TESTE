"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2 } from "lucide-react";

type Item = { id: string; nome: string; ativo: boolean };

export function ParamManager({ resource }: { resource: string }) {
  const [itens, setItens] = useState<Item[]>([]);
  const [nome, setNome] = useState("");
  const [erro, setErro] = useState<string | null>(null);

  async function load() {
    const res = await fetch(`/api/${resource}`);
    const body = await res.json();
    setItens(body.data ?? []);
  }

  useEffect(() => { load(); }, []);

  async function create() {
    setErro(null);
    const res = await fetch(`/api/${resource}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome }),
    });
    const body = await res.json();
    if (!res.ok) {
      setErro(body.error?.message ?? "Erro ao criar");
      return;
    }
    setNome("");
    await load();
  }

  async function remove(id: string) {
    await fetch(`/api/${resource}/${id}`, { method: "DELETE" });
    await load();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-end gap-3">
        <div className="space-y-1">
          <Label htmlFor="novo-nome">Novo nome</Label>
          <Input id="novo-nome" value={nome} onChange={(e) => setNome(e.target.value)} />
        </div>
        <Button onClick={create}>Adicionar</Button>
      </div>
      {erro && <p className="text-sm text-destructive">{erro}</p>}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Ativo</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {itens.map((item) => (
            <TableRow key={item.id}>
              <TableCell>{item.nome}</TableCell>
              <TableCell>{item.ativo ? "Sim" : "Não"}</TableCell>
              <TableCell className="text-right">
                <Button variant="ghost" size="sm" onClick={() => remove(item.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
