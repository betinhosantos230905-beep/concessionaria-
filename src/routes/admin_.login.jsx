import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Loader2, Lock, ShieldCheck } from "lucide-react";
import Brand from "@/components/site/Brand";
import { adminLogin, adminSetup, adminStatus } from "@/lib/django-auth-fns";

import { STORE_DEFAULTS } from "@/lib/storeDefaults";

export const Route = createFileRoute("/admin_/login")({
  ssr: false,
  head: () => ({ meta: [{ title: "Painel da loja — Vassouras Motos" }, { name: "robots", content: "noindex" }] }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState("checking");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    adminStatus({ data: {} })
      .then((result) => {
        if (result.valid) {
          navigate({ to: "/admin", replace: true });
          return;
        }
        setMode(result.configured ? "login" : "setup");
      })
      .catch(() => setMode("login"));
  }, [navigate]);

  const submit = async (event) => {
    event.preventDefault();
    setError("");

    if (mode === "setup" && password.length < 8) {
      setError("Use pelo menos 8 caracteres.");
      return;
    }

    setBusy(true);
    try {
      const result =
        mode === "setup"
          ? await adminSetup({ data: { password } })
          : await adminLogin({ data: { password } });

      if (result.ok) {
        navigate({ to: "/admin", replace: true });
        return;
      }
      if (result.error === "locked") {
        setError(`Muitas tentativas. Aguarde ${result.seconds || 60} segundos.`);
      } else if (result.error === "not_configured" || result.error === "already_configured") {
        setMode(result.error === "not_configured" ? "setup" : "login");
        setError(result.error === "not_configured" ? "" : "Senha já configurada. Faça login.");
      } else {
        setError("Senha incorreta.");
      }
    } catch {
      setError("Não foi possível validar agora. Tente novamente.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid min-h-screen bg-background lg:grid-cols-[1fr_1fr]">
      <div className="relative hidden overflow-hidden border-r border-white/[0.08] lg:block">
        <img
          src={STORE_DEFAULTS.hero_image}
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-45"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-background/30" />
        <div className="relative flex h-full flex-col justify-between p-10">
          <Brand store={STORE_DEFAULTS} />
          <div>
            <h1 className="font-heading text-4xl font-bold leading-tight text-foreground">
              Gestão do estoque,
              <br />
              <span className="text-primary">sem complicação.</span>
            </h1>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">
              Cadastre veículos, publique fotos e acompanhe os contatos recebidos em um só lugar.
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center px-5 py-14">
        <div className="w-full max-w-sm">
          <div className="lg:hidden">
            <Brand store={STORE_DEFAULTS} />
          </div>

          <div className="mt-8 lg:mt-0">
            <span className="grid h-11 w-11 place-items-center rounded-xl border border-primary/25 bg-primary/10 text-primary">
              {mode === "setup" ? <ShieldCheck className="h-5 w-5" /> : <Lock className="h-5 w-5" />}
            </span>
            <h2 className="mt-4 font-heading text-2xl font-bold text-foreground">
              {mode === "setup" ? "Definir senha do painel" : "Painel da loja"}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {mode === "setup"
                ? "Defina a senha que a equipe usará para entrar. Apenas senha, sem e-mail e sem cadastro."
                : "Acesso restrito à equipe da loja. Apenas senha."}
            </p>
          </div>

          {mode === "checking" ? (
            <div className="mt-10 flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin text-primary" /> Carregando...
            </div>
          ) : (
            <form onSubmit={submit} className="mt-8 space-y-3">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === "setup" ? "Senha do painel (mín. 8 caracteres)" : "Senha do painel"}
                autoComplete={mode === "setup" ? "new-password" : "current-password"}
                required
                className="field"
              />
              {error ? <p className="text-[13px] text-destructive">{error}</p> : null}

              <button type="submit" disabled={busy} className="primary-btn w-full py-3.5 disabled:opacity-60">
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {mode === "setup" ? "Salvar senha e entrar" : "Entrar no painel"}
              </button>
            </form>
          )}

          <p className="mt-6 text-[11px] leading-relaxed text-muted-foreground">
            Senha única para toda a equipe. Troque quando necessário em Configurações.
          </p>
        </div>
      </div>
    </div>
  );
}


