import { useCallback } from "react";
import { createFileRoute, useParams } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import VehicleForm from "@/components/admin/VehicleForm";
import { adminGetVehicle } from "@/lib/admin-fns";
import { useAdminData } from "@/lib/useAdminData";

export const Route = createFileRoute("/admin/veiculo/$id")({
  head: () => ({ meta: [{ title: "Editar veículo — Painel" }, { name: "robots", content: "noindex" }] }),
  component: EditVehiclePage,
});

function EditVehiclePage() {
  const { id } = useParams({ from: "/admin/veiculo/$id" });
  const loader = useCallback((token) => adminGetVehicle({ data: { token, id } }), [id]);
  const { data, loading } = useAdminData(loader, [id]);

  if (loading && !data) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin text-primary" /> Carregando anúncio...
      </div>
    );
  }

  if (!data?.vehicle) {
    return (
      <p className="rounded-xl border border-white/10 bg-card px-5 py-8 text-sm text-muted-foreground">
        Veículo não encontrado. Ele pode ter sido excluído.
      </p>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">
          {data.vehicle.brand} {data.vehicle.model}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">Edite os dados, as fotos e a visibilidade do anúncio.</p>
      </div>
      <VehicleForm vehicle={data.vehicle} />
    </div>
  );
}