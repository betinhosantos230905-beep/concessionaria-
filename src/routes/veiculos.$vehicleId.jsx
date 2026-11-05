import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { MessageCircle, Phone, MapPin, Clock, Check, ShieldCheck, Calendar, ArrowLeft } from "lucide-react";
import SiteHeader from "@/components/site/SiteHeader";
import SiteFooter from "@/components/site/SiteFooter";
import WhatsAppFab from "@/components/site/WhatsAppFab";
import VehicleGallery from "@/components/site/VehicleGallery";
import VehicleCard from "@/components/site/VehicleCard";
import LeadDialog from "@/components/site/LeadDialog";
import { getStore, getVehicleDetail } from "@/lib/public-fns";
import { STORE_DEFAULTS } from "@/lib/storeDefaults";
import { brl, km, vehicleTitle, whatsappLink, leadMessage, formatPhone } from "@/lib/format";

export const Route = createFileRoute("/veiculos/$vehicleId")({
  loader: async ({ params }) => {
    const data = await getVehicleDetail({ data: { id: params.vehicleId } });
    if (!data) throw notFound();
    const store = await getStore();
    return { ...data, store };
  },
  head: ({ loaderData }) => {
    const v = loaderData?.vehicle;
    if (!v) return { meta: [{ title: "Veículo — Vassouras Motos" }] };
    const title = `${vehicleTitle(v)} ${v.year_model} — Vassouras Motos`;
    return {
      meta: [
        { title },
        {
          name: "description",
          content: `${vehicleTitle(v)} ${v.year_model}, ${km(v.mileage)}, ${v.transmission}, ${v.fuel}. ${brl(v.price)}. Confira fotos e ficha completa.`,
        },
      ],
    };
  },
  component: VehiclePage,
});

const SPECS = [
  ["Marca", (v) => v.brand],
  ["Modelo", (v) => v.model],
  ["Versão", (v) => v.version],
  ["Ano fab./modelo", (v) => [v.year_manufacture, v.year_model].filter(Boolean).join("/")],
  ["Quilometragem", (v) => (v.mileage || v.mileage === 0 ? km(v.mileage) : null)],
  ["Combustível", (v) => v.fuel],
  ["Câmbio", (v) => v.transmission],
  ["Cor", (v) => v.color],
  ["Portas", (v) => (v.doors ? String(v.doors) : null)],
  ["Motor", (v) => v.engine],
  ["Potência", (v) => v.power],
  ["Categoria", (v) => v.category],
  ["Carroceria", (v) => v.body_type],
];

function VehiclePage() {
  const { vehicle, similar, store } = Route.useLoaderData();
  const storeData = store || STORE_DEFAULTS;
  const wa = whatsappLink(storeData.whatsapp, leadMessage(vehicle));
  const sold = vehicle.status === "sold";
  const specs = SPECS.map(([label, get]) => [label, get(vehicle)]).filter(([, value]) => value);
  const features = vehicle.features || [];
  const equipment = vehicle.equipment || [];

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader store={storeData} />
      <main className="pt-28">
        <div className="shell">
          <Link
            to="/veiculos"
            className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground transition hover:text-primary"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> voltar ao estoque
          </Link>

          <div className="mt-5 grid gap-8 lg:grid-cols-[1.5fr_1fr]">
            <div>
              <VehicleGallery images={vehicle.images} alt={vehicleTitle(vehicle)} />
            </div>

            <div className="lg:sticky lg:top-24 lg:self-start">
              <div className="rounded-2xl border border-white/[0.08] bg-card p-6">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-[10px] uppercase tracking-[0.26em] text-primary">
                    {vehicle.brand}
                  </span>
                  {vehicle.featured ? (
                    <span className="rounded bg-primary/15 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-primary">
                      destaque
                    </span>
                  ) : null}
                  {sold ? (
                    <span className="rounded bg-destructive/15 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-destructive">
                      vendido
                    </span>
                  ) : null}
                </div>

                <h1 className="mt-2 font-heading text-[26px] font-bold leading-tight text-foreground">
                  {vehicle.model}
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">{vehicle.version}</p>

                <div className="mt-5 border-t border-white/[0.08] pt-5">
                  <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                    valor à vista
                  </span>
                  <p className="font-heading text-[34px] font-bold leading-none text-primary">
                    {brl(vehicle.price)}
                  </p>
                </div>

                <div className="mt-5 grid grid-cols-3 gap-2 rounded-xl border border-white/[0.08] bg-white/[0.02] p-3 text-center">
                  <div>
                    <p className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">ano</p>
                    <p className="font-heading text-sm font-semibold text-foreground">
                      {vehicle.year_manufacture}/{vehicle.year_model}
                    </p>
                  </div>
                  <div className="border-x border-white/[0.08]">
                    <p className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">km</p>
                    <p className="font-heading text-sm font-semibold text-foreground">
                      {new Intl.NumberFormat("pt-BR").format(vehicle.mileage || 0)}
                    </p>
                  </div>
                  <div>
                    <p className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">câmbio</p>
                    <p className="truncate font-heading text-sm font-semibold text-foreground">
                      {vehicle.transmission}
                    </p>
                  </div>
                </div>

                <div className="mt-5 space-y-2.5">
                  {wa ? (
                    <a
                      href={wa}
                      target="_blank"
                      rel="noreferrer"
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] px-5 py-3.5 text-sm font-semibold text-[#04331b] transition hover:brightness-105"
                    >
                      <MessageCircle className="h-5 w-5" />
                      Falar no WhatsApp
                    </a>
                  ) : null}

                  <LeadDialog
                    vehicle={vehicle}
                    trigger={
                      <button type="button" className="primary-btn w-full py-3.5">
                        Quero mais informações
                      </button>
                    }
                  />

                  {storeData.phone ? (
                    <a href={`tel:${storeData.phone}`} className="ghost-btn w-full py-3">
                      <Phone className="h-4 w-4" /> {formatPhone(storeData.phone)}
                    </a>
                  ) : null}
                </div>

                {!storeData.whatsapp ? (
                  <p className="mt-3 text-center text-[11px] text-muted-foreground">
                    WhatsApp não configurado. Use o formulário de interesse ou o telefone da loja.
                  </p>
                ) : null}
              </div>
            </div>
          </div>

          <div className="mt-12 grid gap-10 pb-16 lg:grid-cols-[1.5fr_1fr]">
            <div className="space-y-10">
              <section>
                <h2 className="font-heading text-xl font-semibold text-foreground">Ficha técnica</h2>
                <dl className="mt-4 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.06] sm:grid-cols-3">
                  {specs.map(([label, value]) => (
                    <div key={label} className="bg-card px-4 py-3.5">
                      <dt className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground">
                        {label}
                      </dt>
                      <dd className="mt-1 text-sm font-medium text-foreground">{value}</dd>
                    </div>
                  ))}
                </dl>
              </section>

              {vehicle.description ? (
                <section>
                  <h2 className="font-heading text-xl font-semibold text-foreground">Sobre o veículo</h2>
                  <p className="mt-3 whitespace-pre-line text-[15px] leading-relaxed text-muted-foreground">
                    {vehicle.description}
                  </p>
                </section>
              ) : null}

              {features.length ? (
                <section>
                  <h2 className="font-heading text-xl font-semibold text-foreground">Opcionais</h2>
                  <ul className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {features.map((item) => (
                      <li key={item} className="flex items-center gap-2 text-sm text-foreground/85">
                        <Check className="h-3.5 w-3.5 shrink-0 text-primary" /> {item}
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}

              {equipment.length ? (
                <section>
                  <h2 className="font-heading text-xl font-semibold text-foreground">Equipamentos</h2>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {equipment.map((item) => (
                      <span
                        key={item}
                        className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[13px] text-foreground/80"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </section>
              ) : null}
            </div>

            <aside className="space-y-4">
              <div className="rounded-2xl border border-white/[0.08] bg-card p-5">
                <h2 className="font-heading text-base font-semibold text-foreground">{storeData.name}</h2>
                <ul className="mt-4 space-y-3 text-sm text-foreground/80">
                  {storeData.address || storeData.city ? (
                    <li className="flex gap-2.5">
                      <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <span>
                        {storeData.address}
                        {[storeData.city, storeData.state].filter(Boolean).length
                          ? `${storeData.address ? " — " : ""}${[storeData.city, storeData.state]
                              .filter(Boolean)
                              .join("/")}`
                          : ""}
                      </span>
                    </li>
                  ) : null}
                  {storeData.opening_hours ? (
                    <li className="flex gap-2.5">
                      <Clock className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <span className="whitespace-pre-line">{storeData.opening_hours}</span>
                    </li>
                  ) : null}
                </ul>
                <div className="mt-4 flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/[0.07] px-3 py-2.5 text-[12px] text-primary">
                  <ShieldCheck className="h-4 w-4 shrink-0" />
                  Anúncio conferido pela loja
                </div>
              </div>

              <div className="rounded-2xl border border-white/[0.08] bg-card p-5">
                <div className="flex items-center gap-2 text-[13px] text-muted-foreground">
                  <Calendar className="h-4 w-4 text-primary" />
                  Agende uma visita para conhecer o veículo
                </div>
              </div>
            </aside>
          </div>

          {similar.length ? (
            <section className="border-t border-white/[0.08] py-14">
              <span className="eyebrow">veja também</span>
              <h2 className="mt-2 font-heading text-2xl font-bold text-foreground">Veículos semelhantes</h2>
              <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {similar.map((item) => (
                  <VehicleCard key={item.id} vehicle={item} />
                ))}
              </div>
            </section>
          ) : null}
        </div>
      </main>
      <SiteFooter store={storeData} />
      <WhatsAppFab store={storeData} message={leadMessage(vehicle)} />
    </div>
  );
}