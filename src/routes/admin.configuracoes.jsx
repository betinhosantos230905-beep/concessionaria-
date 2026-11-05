import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Loader2, KeyRound } from "lucide-react";
import { toast } from "sonner";
import SettingsForm from "@/components/admin/SettingsForm";
import { adminChangePassword, adminGetSettings } from "@/lib/admin-fns";
import { getToken, setToken } from "@/lib/adminSession";
import { useAdminData } from "@/lib/useAdminData";

export const Route = createFileRoute("/admin/configuracoes")({
  head: () => ({ meta: [{ title: "Configurações — Painel" }, { name: "robots", content: "noindex" }] }),
  component: AdminSettingsPage,
});

function AdminSettingsPage() {
  const { data, loading } = useAdminData((token) => adminGetSettings({ data: { token } }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">Configurações da loja</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Essas informações aparecem automaticamente na vitrine pública.
        </p>
      </div>

      {loading && !data ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin text-primary" /> Carregando configurações...
        </div>
      ) : (
        <SettingsForm initial={data?.settings} />
      )}

      <PasswordCard />
    </div>
  );
}

function PasswordCard() {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    if (password.length < 8) {
      toast.error("Use pelo menos 8 caracteres.");
      return;
    }
    if (password !== confirm) {
      toast.error("As senhas não conferem.");
      return;
    }
    setSaving(true);
    try {
      const result = await adminChangePassword({ data: { token: getToken(), password } });
      if (result?.ok) {
        setToken(result.token);
        toast.success("Senha administrativa atualizada.");
        setPassword("");
        setConfirm("");
        setOpen(false);
      } else {
        toast.error("Não foi possível alterar a senha.");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-card p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="font-heading text-sm font-semibold uppercase tracking-wider text-foreground">
            Senha do painel
          </h2>
          <p className="mt-1 text-[12px] text-muted-foreground">
            Senha compartilhada usada por toda a equipe para acessar o painel.
          </p>
        </div>
        <button type="button" onClick={() => setOpen((v) => !v)} className="ghost-btn shrink-0">
          <KeyRound className="h-4 w-4" /> {open ? "Cancelar" : "Alterar"}
        </button>
      </div>

      {open ? (
        <form onSubmit={submit} className="mt-4 grid gap-3 sm:grid-cols-2">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Nova senha"
            className="field"
          />
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Repita a nova senha"
            className="field"
          />
          <button type="submit" disabled={saving} className="primary-btn sm:col-span-2 disabled:opacity-60">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Salvar nova senha
          </button>
        </form>
      ) : null}
    </div>
  );
}