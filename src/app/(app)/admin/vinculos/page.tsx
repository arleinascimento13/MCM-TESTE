"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2 } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";

type User = { id: string; nome: string };

type Assignment = {
  id: string;
  funcionario: { nome: string };
  jobLeader: { nome: string };
  criadoEm: string;
};

export default function VinculosPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [funcionarioId, setFuncionarioId] = useState<string>("");
  const [jobLeaderId, setJobLeaderId] = useState<string>("");
  const [erro, setErro] = useState<string | null>(null);

  async function load() {
    const [assignRes, usersRes] = await Promise.all([
      fetch("/api/job-leader-assignments"),
      fetch("/api/users"),
    ]);
    const assignBody = await assignRes.json();
    const usersBody = await usersRes.json();
    setAssignments(assignBody.data ?? []);
    setUsers(usersBody.data ?? []);
  }

  useEffect(() => { load(); }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    const res = await fetch("/api/job-leader-assignments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ funcionarioId, jobLeaderId }),
    });
    const body = await res.json();
    if (!res.ok) {
      setErro(body.error?.message ?? "Erro ao criar");
      return;
    }
    setFuncionarioId("");
    setJobLeaderId("");
    await load();
  }

  async function remove(id: string) {
    await fetch(`/api/job-leader-assignments/${id}`, { method: "DELETE" });
    await load();
  }

  return (
    <>
      <PageHeader title="Job Leaders" subtitle="Vincule funcionários aos seus job leaders" />
      <main className="space-y-4 p-4 sm:p-6">
        <form onSubmit={create} className="flex items-end gap-3 flex-wrap">
        <div className="space-y-1">
          <Label htmlFor="funcionario">Funcionário</Label>
          <Select value={funcionarioId} onValueChange={(v) => { if (v) setFuncionarioId(v); }} required>
            <SelectTrigger id="funcionario">
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
          <Label htmlFor="job-leader">Job Leader</Label>
          <Select value={jobLeaderId} onValueChange={(v) => { if (v) setJobLeaderId(v); }} required>
            <SelectTrigger id="job-leader">
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              {users.map((u) => (
                <SelectItem key={u.id} value={u.id}>{u.nome}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button type="submit">Criar</Button>
      </form>
      {erro && <p className="text-sm text-destructive">{erro}</p>}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Funcionário</TableHead>
            <TableHead>Job Leader</TableHead>
            <TableHead>Criado em</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {assignments.map((a) => (
            <TableRow key={a.id}>
              <TableCell>{a.funcionario.nome}</TableCell>
              <TableCell>{a.jobLeader.nome}</TableCell>
              <TableCell>{new Date(a.criadoEm).toLocaleDateString("pt-BR")}</TableCell>
              <TableCell className="text-right">
                <Button variant="ghost" size="sm" onClick={() => remove(a.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      </main>
    </>
  );
}
