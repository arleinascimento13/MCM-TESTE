"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2 } from "lucide-react";

type User = { id: string; nome: string; email: string; papel: string; ativo: boolean; criadoEm: string };

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<User[]>([]);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [papel, setPapel] = useState<string>("");
  const [erro, setErro] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/users");
    const body = await res.json();
    setUsuarios(body.data ?? []);
  }

  useEffect(() => { load(); }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome, email, senha, papel }),
    });
    const body = await res.json();
    if (!res.ok) {
      setErro(body.error?.message ?? "Erro ao criar");
      return;
    }
    setNome("");
    setEmail("");
    setSenha("");
    setPapel("");
    await load();
  }

  async function deactivate(id: string) {
    await fetch(`/api/users/${id}`, { method: "DELETE" });
    await load();
  }

  return (
    <div className="space-y-4">
      <form onSubmit={create} className="flex items-end gap-3 flex-wrap">
        <div className="space-y-1">
          <Label htmlFor="nome">Nome</Label>
          <Input id="nome" value={nome} onChange={(e) => setNome(e.target.value)} required />
        </div>
        <div className="space-y-1">
          <Label htmlFor="email">E-mail</Label>
          <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="space-y-1">
          <Label htmlFor="senha">Senha</Label>
          <Input id="senha" type="password" value={senha} onChange={(e) => setSenha(e.target.value)} required />
        </div>
        <div className="space-y-1">
          <Label htmlFor="papel">Papel</Label>
          <Select value={papel} onValueChange={(v) => { if (v) setPapel(v); }} required>
            <SelectTrigger id="papel">
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ADMIN">Admin</SelectItem>
              <SelectItem value="JOB_LEADER">Job Leader</SelectItem>
              <SelectItem value="FUNCIONARIO">Funcionário</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button type="submit">Criar</Button>
      </form>
      {erro && <p className="text-sm text-destructive">{erro}</p>}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>E-mail</TableHead>
            <TableHead>Papel</TableHead>
            <TableHead>Ativo</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {usuarios.map((u) => (
            <TableRow key={u.id}>
              <TableCell>{u.nome}</TableCell>
              <TableCell>{u.email}</TableCell>
              <TableCell>{u.papel}</TableCell>
              <TableCell>{u.ativo ? "Sim" : "Não"}</TableCell>
              <TableCell className="text-right">
                <Button variant="ghost" size="sm" onClick={() => deactivate(u.id)} disabled={!u.ativo}>
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
