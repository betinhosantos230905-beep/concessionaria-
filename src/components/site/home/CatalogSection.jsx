import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import VehicleCard from "@/components/site/VehicleCard";

export default function CatalogSection({
  eyebrow = "estoque",
  title = "Veículos disponíveis",
  description,
  vehicles = [],
  action,
}) {
  return (
    <section className="shell py-16 sm:py-20">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="eyebrow">{eyebrow}</span>
          <h2 className="mt-3 font-heading text-[clamp(1.7rem,3.6vw,2.6rem)] font-bold leading-tight text-foreground">
            {title}
          </h2>
          {description ? (
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {action ? (
          <Link
            to={action.to}
            search={action.search}
            className="group inline-flex items-center gap-2 border-b border-primary/40 pb-1 font-mono text-[11px] uppercase tracking-[0.2em] text-primary transition hover:border-primary"
          >
            {action.label}
            <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-1" />
          </Link>
        ) : null}
      </div>

      {vehicles.length ? (
        <div className="mt-9 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {vehicles.map((vehicle) => (
            <VehicleCard key={vehicle.id} vehicle={vehicle} />
          ))}
        </div>
      ) : (
        <div className="mt-9 rounded-2xl border border-dashed border-white/15 bg-white/[0.02] px-6 py-16 text-center">
          <p className="font-heading text-lg text-foreground">Nenhum veículo anunciado no momento</p>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Novos veículos entram no estoque toda semana. Fale com a loja para saber o que está chegando.
          </p>
          <Link to="/" hash="contato" className="primary-btn mt-6 inline-flex">
            Falar com a loja
          </Link>
        </div>
      )}
    </section>
  );
}