import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Inbox, Loader2 } from "lucide-react";
import LeadCard from "@/components/admin/LeadCard";
import { adminListLeads } from "@/lib/django-lead-fns";
import { useAdminData } from "@/lib/useAdminData";
import { LEAD_STATUS } from "@/lib/storeDefaults";

const TABS = [{ value: "all", label: "Todos" }, ...LEAD_STATUS];

export const Route = createFileRoute("/admin/interessados")({
  head: () => ({ meta: [{ title: "Interessados — Painel" }, { name: "robots", content: "noindex" }] }),
  component: AdminLeads,
});

function AdminLeads() {
  const [status, setStatus] = useState("all");
  const { data, loading, reload } = useAdminData(
    (token) => adminListLeads({ data: { status } }),
    [status]
  );

  const counts = (data?.counts || []).reduce((acc, row) => ({ ...acc, [row.status]: row.count }), {});
  const items = data?.items || [];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">Interessados</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Contatos recebidos pelo site, com veículo de interesse e status do atendimento.
        </p>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setStatus(tab.value)}
            className={`rounded-lg px-3 py-2 font-mono text-[11px] uppercase tracking-wider transition ${
              status === tab.value
                ? "bg-primary/15 text-primary"
                : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
            }`}
          >
            {tab.label}
            {tab.value !== "all" && counts[tab.value] ? ` · ${counts[tab.value]}` : ""}
          </button>
        ))}
      </div>

      {loading && !data ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin text-primary" /> Carregando contatos...
        </div>
      ) : items.length ? (
        <div className="grid gap-3 lg:grid-cols-2">
          {items.map((lead) => (
            <LeadCard key={lead.id} lead={lead} onChanged={reload} />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] px-6 py-16 text-center">
          <Inbox className="mx-auto h-8 w-8 text-muted-foreground/50" />
          <p className="mt-3 font-heading text-base text-foreground">Nenhum contato por aqui</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Os contatos enviados na vitrine e pelo WhatsApp aparecem nesta área.
          </p>
        </div>
      )}
    </div>
  );
}