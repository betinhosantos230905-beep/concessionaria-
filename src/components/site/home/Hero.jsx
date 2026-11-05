import { ShieldCheck, Wrench, MapPin } from "lucide-react";
import HomeSearch from "@/components/site/HomeSearch";
import { STORE_DEFAULTS } from "@/lib/storeDefaults";

const TRUST = [
  { icon: ShieldCheck, label: "Documentação conferida" },
  { icon: Wrench, label: "Revisão antes da entrega" },
  { icon: MapPin, label: `${STORE_DEFAULTS.city}/${STORE_DEFAULTS.state}` },
];

export default function Hero({ store = STORE_DEFAULTS, total }) {
  return (
    <section className="relative isolate min-h-[92vh] overflow-hidden pb-16 pt-32 sm:pt-36">
      <img
        src={store.hero_image || STORE_DEFAULTS.hero_image}
        alt="Showroom de veículos"
        className="absolute inset-0 -z-20 h-full w-full object-cover opacity-70"
      />
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-background via-background/85 to-background/30" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-background via-transparent to-background/70" />

      <div className="shell relative">
        <div className="max-w-2xl">
          <span className="rise eyebrow inline-flex items-center gap-2">
            <span className="h-px w-8 bg-primary" />
            {store.city}/{store.state} · {total} veículos no estoque
          </span>

          <h1
            className="rise mt-5 font-heading text-[clamp(2.4rem,6.2vw,4.6rem)] font-bold leading-[0.98] tracking-[-0.03em] text-foreground"
            style={{ animationDelay: "80ms" }}
          >
            O veículo certo,
            <br />
            <span className="text-primary">com procedência</span>
            <br />
            que você confia.
          </h1>

          <p
            className="rise mt-6 max-w-lg text-[15px] leading-relaxed text-muted-foreground sm:text-base"
            style={{ animationDelay: "160ms" }}
          >
            Estoques selecionados, ficha técnica completa e atendimento direto com nossa equipe.
            Sem intermediários, sem letras miúdas.
          </p>
        </div>

        <div className="rise mt-10 max-w-3xl" style={{ animationDelay: "240ms" }}>
          <HomeSearch store={store} />
        </div>

        <div
          className="rise mt-10 flex flex-wrap gap-x-8 gap-y-3"
          style={{ animationDelay: "320ms" }}
        >
          {TRUST.map(({ icon: Icon, label }) => (
            <span key={label} className="flex items-center gap-2 text-[13px] text-foreground/70">
              <Icon className="h-4 w-4 text-primary" />
              {label}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}