import { Link } from "@tanstack/react-router";
import { Gauge, Cog, Fuel, Bike } from "lucide-react";
import { Image } from "@/components/ui/image";
import { brl, km as fmtKm } from "@/lib/format";

function Spec({ icon: Icon, children }) {
  return (
    <span className="flex min-w-0 items-center gap-1.5 font-mono text-[11px] uppercase tracking-wide text-muted-foreground">
      <Icon className="h-3.5 w-3.5 shrink-0 text-primary/80" />
      <span className="truncate">{children}</span>
    </span>
  );
}

export default function VehicleCard({ vehicle }) {
  const cover = vehicle?.images?.[0];
  const sold = vehicle?.status === "sold";

  return (
    <Link
      to="/veiculos/$vehicleId"
      params={{ vehicleId: vehicle.id }}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-white/[0.07] bg-card transition-all duration-500 hover:-translate-y-1.5 hover:border-primary/50 hover:shadow-[0_28px_70px_-30px_hsl(var(--primary)/0.55)]"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-secondary">
        {cover ? (
          <Image
            src={cover}
            alt={`${vehicle.brand} ${vehicle.model}`}
            className="h-full w-full object-cover transition-transform duration-[1100ms] ease-out group-hover:scale-[1.07]"
          />
        ) : (
          <div className="grid h-full w-full place-items-center text-muted-foreground/40">
            <Bike className="h-10 w-10" />
          </div>
        )}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 via-black/5 to-transparent" />

        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          {vehicle.featured ? (
            <span className="rounded-md bg-primary px-2 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-white">
              Destaque
            </span>
          ) : null}
          {sold ? (
            <span className="rounded-md bg-destructive px-2 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-white">
              Vendido
            </span>
          ) : null}
          {vehicle.is_demo ? (
            <span className="rounded-md border border-white/25 bg-black/50 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-white/80 backdrop-blur">
              Exemplo
            </span>
          ) : null}
        </div>

        <div className="absolute bottom-3 left-3 rounded-lg border border-white/15 bg-black/55 px-2.5 py-1 font-mono text-[11px] tracking-wider text-white/90 backdrop-blur-sm">
          {vehicle.year_manufacture}/{vehicle.year_model}
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-primary/90">
          {vehicle.brand}
        </span>
        <h3 className="mt-1.5 truncate font-heading text-lg font-semibold text-foreground">
          {vehicle.model}
        </h3>
        <p className="mt-0.5 truncate text-[13px] text-muted-foreground">{vehicle.version}</p>

        <div className="mt-4 flex items-center justify-between gap-2 border-t border-white/[0.07] pt-3">
          <Spec icon={Gauge}>{fmtKm(vehicle.mileage)}</Spec>
          <Spec icon={Cog}>{vehicle.transmission}</Spec>
          <Spec icon={Fuel}>{vehicle.fuel}</Spec>
        </div>

        <div className="mt-4 flex items-end justify-between">
          <div>
            <span className="block font-mono text-[9px] uppercase tracking-[0.22em] text-muted-foreground">
              à vista
            </span>
            <span className="font-heading text-[21px] font-bold leading-tight text-primary">
              {brl(vehicle.price)}
            </span>
          </div>
          <span className="font-mono text-[11px] text-muted-foreground transition group-hover:text-foreground">
            detalhes →
          </span>
        </div>
      </div>
    </Link>
  );
}