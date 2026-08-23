"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2 } from "lucide-react";

type User = { id: string; nome: string };

type Option = { id: string; tipo: string; user: { nome: string }; valorId: string };

type ValorOption = { id: string; nome: string };

const tipoLabel = (t: string) =>
  t === "DISCIPLINA" ? "Disciplina" : t === "CENTRO_CUSTO" ? "Centro de custo" : "Local";

export default function OpcoesPage() {
  const [options, setOptions] = useState<Option[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [valores, setValores] = useState<ValorOption[]>([]);
  const [valorNames, setValorNames] = useState<Record<string, string>>({});
  const [userId, setUserId] = useState<string>("");
  const [tipo, setTipo] = useState<string>("");
  const [valorId, setValorId] = useState<string>("");
  const [erro, setErro] = useState<string | null>(null);

  async function load() {
    const [optRes, usersRes, discRes, ccRes, locRes] = await Promise.all([
      fetch("/api/user-allowed-options"),
      fetch("/api/users"),
      fetch("/api/disciplines"),
      fetch("/api/cost-centers"),
      fetch("/api/locations"),
    ]);
    const optBody = await optRes.json();
    const usersBody = await usersRes.json();
    const discBody = await discRes.json();
    const ccBody = await ccRes.json();
    const locBody = await locRes.json();
    setOptions(optBody.data ?? []);
    setUsers(usersBody.data ?? []);

    const names: Record<string, string> = {};
    (discBody.data ?? []).forEach((d: { id: string; nome: string }) => { names[d.id] = d.nome; });
    (ccBody.data ?? []).forEach((c: { id: string; nome: string }) => { names[c.id] = c.nome; });
    (locBody.data ?? []).forEach((l: { id: string; nome: string }) => { names[l.id] = l.nome; });
    setValorNames(names);
  }

  useEffect(() => { load(); }, []);

  async function loadValores(t: string) {
    const endpoint = t === "DISCIPLINA" ? "disciplines" : t === "CENTRO_CUSTO" ? "cost-centers" : "locations";
    const res = await fetch(`/api/${endpoint}`);
    const body = await res.json();
    setValores(body.data ?? []);
  }

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    const res = await fetch("/api/user-allowed-options", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, tipo, valorId }),
    });
    const body = await res.json();
    if (!res.ok) {
      setErro(body.error?.message ?? "Erro ao criar");
      return;
    }
    setUserId("");
    setTipo("");
    setValorId("");
    setValores([]);
    await load();
  }

  async function remove(id: string) {
    await fetch(`/api/user-allowed-options/${id}`, { method: "DELETE" });
    await load();
  }

  function handleTipoChange(t: string) {
    setTipo(t);
    setValorId("");
    if (t) loadValores(t);
  }

  return (
    <div className="space-y-4">
      <form onSubmit={create} className="flex items-end gap-3 flex-wrap">
        <div className="space-y-1">
          <Label htmlFor="user">Usuário</Label>
          <Select value={userId} onValueChange={(v) => { if (v) setUserId(v); }} required>
            <SelectTrigger id="user">
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              {users.map((u) => (
                <SelectItem key={u.id} value={u.id}>{u.nome}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="tipo">Tipo</Label>
          <Select value={tipo} onValueChange={(v) => { if (v) handleTipoChange(v); }} required>
            <SelectTrigger id="tipo">
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="DISCIPLINA">Disciplina</SelectItem>
              <SelectItem value="CENTRO_CUSTO">Centro de custo</SelectItem>
              <SelectItem value="LOCAL">Local</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="valor">Valor</Label>
          <Select value={valorId} onValueChange={(v) => { if (v) setValorId(v); }} required disabled={!tipo}>
            <SelectTrigger id="valor">
              <SelectValue placeholder={!tipo ? "Selecione o tipo primeiro" : "Selecione"} />
            </SelectTrigger>
            <SelectContent>
              {valores.map((v) => (
                <SelectItem key={v.id} value={v.id}>{v.nome}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button type="submit" disabled={!tipo}>Criar</Button>
      </form>
      {erro && <p className="text-sm text-destructive">{erro}</p>}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Usuário</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Valor</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {options.map((o) => (
            <TableRow key={o.id}>
              <TableCell>{o.user.nome}</TableCell>
              <TableCell>{tipoLabel(o.tipo)}</TableCell>
              <TableCell>{valorNames[o.valorId] ?? o.valorId}</TableCell>
              <TableCell className="text-right">
                <Button variant="ghost" size="sm" onClick={() => remove(o.id)}>
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
