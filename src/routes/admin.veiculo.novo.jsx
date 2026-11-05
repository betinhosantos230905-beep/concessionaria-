import { createFileRoute } from "@tanstack/react-router";
import VehicleForm from "@/components/admin/VehicleForm";

export const Route = createFileRoute("/admin/veiculo/novo")({
  head: () => ({ meta: [{ title: "Novo veículo — Painel" }, { name: "robots", content: "noindex" }] }),
  component: NewVehiclePage,
});

function NewVehiclePage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">Cadastrar veículo</h1>
        <p className="mt-1 text-sm text-muted-foreground">Preencha os dados e publique o anúncio na vitrine.</p>
      </div>
      <VehicleForm />
    </div>
  );
}