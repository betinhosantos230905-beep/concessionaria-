import { Link, createFileRoute } from "@tanstack/react-router";
import { Car, CheckCircle2, Star, PauseCircle, Inbox, Plus, Loader2, BadgeDollarSign } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, PieChart, Pie } from "recharts";
import StatCard from "@/components/admin/StatCard";
import { adminDashboard } from "@/lib/django-vehicle-fns";
import { useAdminData } from "@/lib/useAdminData";
import { brl, formatDate } from "@/lib/format";

const LEAD_LABEL = { new: "Novos", in_progress: "Em atendimento", done: "Finalizados" };
const LEAD_COLOR = { new: "#0A7CFF", in_progress: "#F5B400", done: "#22C55E" };

export const Route = createFileRoute("/admin/")({
  head: () => ({ meta: [{ title: "Visão geral — Painel" }, { name: "robots", content: "noindex" }] }),
  component: AdminDashboard,
});

function AdminDashboard() {
  const { data, loading } = useAdminData(() => adminDashboard({ data: {} }));

  if (loading && !data) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin text-primary" /> Carregando indicadores...
      </div>
    );
  }

  const counts = data?.counts || {};
  const brands = data?.brands || [];
  const leads = (data?.leads || []).map((row) => ({
    name: LEAD_LABEL[row.status] || row.status,
    value: row.count,
    color: LEAD_COLOR[row.status] || "#888",
  }));
  const totalLeads = leads.reduce((sum, row) => sum + row.value, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Visão geral</h1>
          <p className="mt-1 text-sm text-muted-foreground">Resumo do estoque e dos contatos recebidos.</p>
        </div>
        <Link to="/admin/veiculo/novo" className="primary-btn">
          <Plus className="h-4 w-4" /> Novo veículo
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Veículos cadastrados" value={counts.total ?? 0} icon={Car} tone="blue" />
        <StatCard label="Disponíveis" value={counts.available ?? 0} icon={CheckCircle2} tone="green" />
        <StatCard label="Vendidos" value={counts.sold ?? 0} icon={BadgeDollarSign} tone="red" />
        <StatCard label="Pausados" value={counts.paused ?? 0} icon={PauseCircle} tone="amber" />
        <StatCard label="Em destaque" value={counts.featured ?? 0} icon={Star} tone="blue" />
        <StatCard
          label="Interessados"
          value={counts.leadsTotal ?? 0}
          icon={Inbox}
          tone="blue"
          hint={`${counts.leadsNew ?? 0} aguardando atendimento`}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="rounded-2xl border border-white/[0.08] bg-card p-5">
          <h2 className="font-heading text-sm font-semibold text-foreground">Estoque por marca</h2>
          {brands.length ? (
            <div className="mt-4 h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={brands} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
                  <XAxis
                    dataKey="brand"
                    tick={{ fill: "#9AA0AB", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis tick={{ fill: "#9AA0AB", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    cursor={{ fill: "rgba(255,255,255,0.04)" }}
                    contentStyle={{
                      background: "#121316",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: 10,
                      fontSize: 12,
                      color: "#F5F7FA",
                    }}
                  />
                  <Bar dataKey="count" name="Veículos" radius={[6, 6, 0, 0]} fill="#0A7CFF" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="mt-6 text-sm text-muted-foreground">Nenhum veículo cadastrado ainda.</p>
          )}
        </div>

        <div className="rounded-2xl border border-white/[0.08] bg-card p-5">
          <h2 className="font-heading text-sm font-semibold text-foreground">Interessados por status</h2>
          {totalLeads ? (
            <>
              <div className="mt-2 h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={leads} dataKey="value" nameKey="name" innerRadius={44} outerRadius={68} paddingAngle={3}>
                      {leads.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} stroke="none" />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: "#121316",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: 10,
                        fontSize: 12,
                        color: "#F5F7FA",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <ul className="mt-2 space-y-1.5">
                {leads.map((row) => (
                  <li key={row.name} className="flex items-center justify-between text-[13px]">
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <span className="h-2 w-2 rounded-full" style={{ background: row.color }} />
                      {row.name}
                    </span>
                    <span className="font-mono text-foreground">{row.value}</span>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="mt-6 text-sm text-muted-foreground">Nenhum contato recebido ainda.</p>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-white/[0.08] bg-card">
        <div className="flex items-center justify-between border-b border-white/[0.08] px-5 py-4">
          <h2 className="font-heading text-sm font-semibold text-foreground">Últimos interessados</h2>
          <Link to="/admin/interessados" className="font-mono text-[11px] uppercase tracking-wider text-primary">
            ver todos
          </Link>
        </div>
        {data?.recentLeads?.length ? (
          <ul className="divide-y divide-white/[0.06]">
            {data.recentLeads.map((lead) => (
              <li key={lead.id} className="flex flex-wrap items-center justify-between gap-2 px-5 py-3.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">{lead.name}</p>
                  <p className="truncate text-[12px] text-muted-foreground">
                    {lead.vehicle_label || "Contato geral"} · {lead.phone}
                  </p>
                </div>
                <span className="font-mono text-[11px] text-muted-foreground">
                  {formatDate(lead.created_date)}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="px-5 py-8 text-sm text-muted-foreground">Os contatos do site aparecerão aqui.</p>
        )}
      </div>
    </div>
  );
}