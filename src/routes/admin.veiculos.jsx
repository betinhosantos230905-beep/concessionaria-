import { useState } from "react";
import { Link, createFileRoute } from "@tanstack/react-router";
import { Search, Plus, Star, Trash2, Pencil, Loader2, Car } from "lucide-react";
import { toast } from "sonner";
import { Image } from "@/components/ui/image";
import { adminDeleteVehicle, adminListVehicles, adminQuickUpdate } from "@/lib/admin-fns";
import { getToken } from "@/lib/adminSession";
import { useAdminData } from "@/lib/useAdminData";
import { brl, km } from "@/lib/format";
import { VEHICLE_STATUS } from "@/lib/storeDefaults";

const TABS = [
  { value: "all", label: "Todos" },
  { value: "available", label: "Disponíveis" },
  { value: "paused", label: "Pausados" },
  { value: "sold", label: "Vendidos" },
];

const STATUS_STYLE = {
  available: "bg-emerald-400/10 text-emerald-400 border-emerald-400/25",
  paused: "bg-amber-400/10 text-amber-400 border-amber-400/25",
  sold: "bg-rose-400/10 text-rose-400 border-rose-400/25",
};

export const Route = createFileRoute("/admin/veiculos")({
  head: () => ({ meta: [{ title: "Veículos — Painel" }, { name: "robots", content: "noindex" }] }),
  component: AdminVehicles,
});

function AdminVehicles() {
  const [q, setQ] = useState("");
  const [draft, setDraft] = useState("");
  const [status, setStatus] = useState("all");
  const [busyId, setBusyId] = useState("");

  const { data, loading, reload } = useAdminData(
    (token) => adminListVehicles({ data: { token, q: q || undefined, status } }),
    [q, status]
  );

  const patch = async (id, payload) => {
    setBusyId(id);
    try {
      const result = await adminQuickUpdate({ data: { token: getToken(), id, patch: payload } });
      if (result?.ok) {
        toast.success("Anúncio atualizado.");
        reload();
      } else {
        toast.error("Não foi possível atualizar.");
      }
    } finally {
      setBusyId("");
    }
  };

  const remove = async (vehicle) => {
    const confirmed = window.confirm(
      `Excluir o anúncio de ${vehicle.brand} ${vehicle.model}? Essa ação não pode ser desfeita.`
    );
    if (!confirmed) return;
    setBusyId(vehicle.id);
    try {
      const result = await adminDeleteVehicle({ data: { token: getToken(), id: vehicle.id } });
      if (result?.ok) {
        toast.success("Anúncio excluído.");
        reload();
      } else {
        toast.error("Não foi possível excluir.");
      }
    } finally {
      setBusyId("");
    }
  };

  const items = data?.items || [];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Veículos</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {data?.total ?? 0} anúncios {status === "all" ? "no total" : "neste filtro"}
          </p>
        </div>
        <Link to="/admin/veiculo/novo" className="primary-btn">
          <Plus className="h-4 w-4" /> Novo veículo
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setQ(draft.trim());
          }}
          className="flex flex-1 items-center gap-2 rounded-xl border border-white/10 bg-card px-3 py-2 sm:max-w-sm"
        >
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Buscar por marca, modelo..."
            className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
        </form>
        <div className="no-scrollbar flex gap-1 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setStatus(tab.value)}
              className={`shrink-0 rounded-lg px-3 py-2 font-mono text-[11px] uppercase tracking-wider transition ${
                status === tab.value
                  ? "bg-primary/15 text-primary"
                  : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {loading && !data ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin text-primary" /> Carregando veículos...
        </div>
      ) : items.length ? (
        <ul className="space-y-3">
          {items.map((vehicle) => (
            <li
              key={vehicle.id}
              className="flex flex-col gap-3 rounded-2xl border border-white/[0.08] bg-card p-3 sm:flex-row sm:items-center"
            >
              <Link
                to="/admin/veiculo/$id"
                params={{ id: vehicle.id }}
                className="flex min-w-0 flex-1 items-center gap-3"
              >
                <div className="h-16 w-24 shrink-0 overflow-hidden rounded-lg bg-secondary">
                  {vehicle.images?.[0] ? (
                    <Image
                      src={vehicle.images[0]}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="grid h-full w-full place-items-center text-muted-foreground/40">
                      <Car className="h-5 w-5" />
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="truncate font-heading text-[15px] font-semibold text-foreground">
                    {vehicle.brand} {vehicle.model}
                  </p>
                  <p className="truncate text-[12px] text-muted-foreground">
                    {vehicle.version} · {vehicle.year_manufacture}/{vehicle.year_model} · {km(vehicle.mileage)}
                  </p>
                  <p className="mt-0.5 font-heading text-sm font-semibold text-primary">{brl(vehicle.price)}</p>
                </div>
              </Link>

              <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                <span
                  className={`rounded-md border px-2 py-1 font-mono text-[10px] uppercase tracking-wider ${
                    STATUS_STYLE[vehicle.status] || STATUS_STYLE.available
                  }`}
                >
                  {VEHICLE_STATUS.find((s) => s.value === vehicle.status)?.label || vehicle.status}
                </span>

                <button
                  type="button"
                  onClick={() => patch(vehicle.id, { featured: !vehicle.featured })}
                  disabled={busyId === vehicle.id}
                  aria-label="Alternar destaque"
                  className={`grid h-9 w-9 place-items-center rounded-lg border transition ${
                    vehicle.featured
                      ? "border-primary/50 bg-primary/15 text-primary"
                      : "border-white/10 bg-white/[0.04] text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Star className={`h-4 w-4 ${vehicle.featured ? "fill-primary" : ""}`} />
                </button>

                <select
                  value={vehicle.status}
                  onChange={(e) => patch(vehicle.id, { status: e.target.value })}
                  disabled={busyId === vehicle.id}
                  aria-label="Status do anúncio"
                  className="rounded-lg border border-white/10 bg-white/[0.04] px-2 py-2 text-[12px] text-foreground focus:border-primary/60 focus:outline-none"
                >
                  {VEHICLE_STATUS.map((option) => (
                    <option key={option.value} value={option.value} className="bg-background">
                      {option.label}
                    </option>
                  ))}
                </select>

                <Link
                  to="/admin/veiculo/$id"
                  params={{ id: vehicle.id }}
                  aria-label="Editar"
                  className="grid h-9 w-9 place-items-center rounded-lg border border-white/10 bg-white/[0.04] text-muted-foreground transition hover:text-foreground"
                >
                  <Pencil className="h-4 w-4" />
                </Link>

                <button
                  type="button"
                  onClick={() => remove(vehicle)}
                  disabled={busyId === vehicle.id}
                  aria-label="Excluir"
                  className="grid h-9 w-9 place-items-center rounded-lg border border-white/10 bg-white/[0.04] text-muted-foreground transition hover:border-destructive/40 hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] px-6 py-16 text-center">
          <Car className="mx-auto h-8 w-8 text-muted-foreground/50" />
          <p className="mt-3 font-heading text-base text-foreground">Nenhum veículo encontrado</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Cadastre o primeiro veículo para publicar o anúncio na vitrine.
          </p>
          <Link to="/admin/veiculo/novo" className="primary-btn mt-5 inline-flex">
            <Plus className="h-4 w-4" /> Cadastrar veículo
          </Link>
        </div>
      )}
    </div>
  );
}