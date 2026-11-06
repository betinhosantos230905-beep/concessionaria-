
import { useEffect, useRef, useState } from "react";
import { Link, Outlet, useNavigate } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Car,
  Inbox,
  Settings,
  LogOut,
  ExternalLink,
  Loader2,
} from "lucide-react";

import Brand from "@/components/site/Brand";
import { adminStatus, adminLogout } from "@/lib/django-auth-fns";
import { STORE_DEFAULTS } from "@/lib/storeDefaults";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/admin", label: "Visão geral", icon: LayoutDashboard, exact: true },
  { to: "/admin/veiculos", label: "Veículos", icon: Car },
  { to: "/admin/interessados", label: "Interessados", icon: Inbox },
  { to: "/admin/configuracoes", label: "Configurações", icon: Settings },
];

export default function AdminShell({ children }) {
  const navigate = useNavigate();
  const [state, setState] = useState("checking");

  const navigateRef = useRef(navigate);
  navigateRef.current = navigate;

  useEffect(() => {
    let active = true;

    adminStatus({ data: {} })
      .then((result) => {
        if (!active) return;

        if (result?.valid) {
          setState("ok");
        } else {
          setState("denied");
          navigateRef.current({
            to: "/admin/login",
            replace: true,
          });
        }
      })
      .catch(() => {
        if (!active) return;

        setState("denied");
        navigateRef.current({
          to: "/admin/login",
          replace: true,
        });
      });

    return () => {
      active = false;
    };
  }, []);

  const logout = async () => {
  try {
    await adminLogout({ data: {} });
  } catch (error) {
    console.error("Erro ao encerrar sessão administrativa:", error);
  } finally {
    navigate({ to: "/admin/login", replace: true });
  }
};

  if (state === "checking") {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <span className="font-mono text-xs uppercase tracking-[0.2em]">
            verificando acesso
          </span>
        </div>
      </div>
    );
  }

  if (state === "denied") return null;

  return (
    <div className="min-h-screen bg-background lg:grid lg:grid-cols-[248px_1fr]">
      <aside className="border-b border-white/[0.08] bg-[#0A0B0D] lg:sticky lg:top-0 lg:h-screen lg:border-b-0 lg:border-r">
        <div className="flex items-center justify-between px-4 py-4 lg:block lg:px-5 lg:py-6">
          <Brand store={STORE_DEFAULTS} size="sm" />
        </div>

        <nav className="no-scrollbar flex gap-1 overflow-x-auto border-t border-white/[0.06] px-3 py-2 lg:flex-col lg:border-t-0 lg:px-3 lg:py-0">
          {NAV.map(({ to, label, icon: Icon, exact }) => (
            <Link
              key={to}
              to={to}
              activeOptions={{ exact }}
              className="group flex shrink-0 items-center gap-2.5 rounded-lg px-3 py-2.5 text-[13px] font-medium text-muted-foreground transition hover:bg-white/[0.05] hover:text-foreground"
              activeProps={{ className: "bg-primary/12 text-primary" }}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </nav>

        <div className="hidden px-3 pb-6 pt-2 lg:absolute lg:bottom-0 lg:block lg:w-full">
          <Link
            to="/"
            className="mb-1 flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-[13px] text-muted-foreground transition hover:bg-white/[0.05] hover:text-foreground"
          >
            <ExternalLink className="h-4 w-4" /> Ver o site
          </Link>

          <button
            type="button"
            onClick={logout}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-[13px] text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
          >
            <LogOut className="h-4 w-4" /> Sair
          </button>
        </div>
      </aside>

      <div className="min-w-0">
        <header className="flex items-center justify-between gap-3 border-b border-white/[0.08] px-4 py-4 sm:px-8">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
              painel da loja
            </p>
            <p className="font-heading text-sm font-semibold text-foreground">
              Vassouras Motos
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link to="/" className="ghost-btn px-3 py-2 text-xs lg:hidden">
              <ExternalLink className="h-3.5 w-3.5" /> Site
            </Link>

            <button
              type="button"
              onClick={logout}
              className={cn("ghost-btn px-3 py-2 text-xs lg:hidden")}
            >
              <LogOut className="h-3.5 w-3.5" /> Sair
            </button>
          </div>
        </header>

        <main className="px-4 py-6 sm:px-8 sm:py-8">
          {children ?? <Outlet />}
        </main>
      </div>
    </div>
  );
}
