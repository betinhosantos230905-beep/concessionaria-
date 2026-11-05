import { MapPin, Clock, Phone, MessageCircle, Instagram } from "lucide-react";
import LeadDialog from "@/components/site/LeadDialog";
import { STORE_DEFAULTS } from "@/lib/storeDefaults";
import { whatsappLink, formatPhone } from "@/lib/format";

export default function ContactSection({ store = STORE_DEFAULTS }) {
  const wa = whatsappLink(store.whatsapp, `Olá! Vim pelo site da ${store.name}.`);

  const rows = [
    {
      icon: MapPin,
      label: "Endereço",
      value:
        [store.address, [store.city, store.state].filter(Boolean).join("/")].filter(Boolean).join(" — ") ||
        "Endereço disponível em breve",
    },
    { icon: Clock, label: "Horários", value: store.opening_hours || "Consulte pelo WhatsApp" },
    { icon: Phone, label: "Telefone", value: store.phone ? formatPhone(store.phone) : "Consulte pelo WhatsApp" },
  ];

  return (
    <section id="contato" className="shell py-16 sm:py-24">
      <div className="overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-primary/[0.14] via-card to-card">
        <div className="grid gap-10 p-7 sm:p-10 lg:grid-cols-[1.1fr_1fr] lg:p-14">
          <div>
            <span className="eyebrow">contato</span>
            <h2 className="mt-3 font-heading text-[clamp(1.7rem,3.6vw,2.6rem)] font-bold leading-tight text-foreground">
              Vamos encontrar o seu próximo veículo.
            </h2>
            <p className="mt-4 max-w-md text-[15px] leading-relaxed text-muted-foreground">
              Fale com a nossa equipe, tire dúvidas sobre qualquer anúncio e agende uma visita para
              conhecer o veículo pessoalmente.
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              {wa ? (
                <a href={wa} target="_blank" rel="noreferrer" className="primary-btn bg-[#25D366] text-[#04331b] shadow-[0_14px_38px_-14px_rgba(37,211,102,0.9)] hover:bg-[#25D366]/90">
                  <MessageCircle className="h-4 w-4" /> Chamar no WhatsApp
                </a>
              ) : store.phone ? (
                <a href={`tel:${store.phone}`} className="primary-btn">
                  <Phone className="h-4 w-4" /> Ligar para a loja
                </a>
              ) : (
                <LeadDialog
                  trigger={
                    <button type="button" className="primary-btn">
                      <MessageCircle className="h-4 w-4" /> Receber contato da loja
                    </button>
                  }
                />
              )}
              {store.instagram ? (
                <a
                  href={`https://instagram.com/${String(store.instagram).replace("@", "")}`}
                  target="_blank"
                  rel="noreferrer"
                  className="ghost-btn"
                >
                  <Instagram className="h-4 w-4" /> Instagram
                </a>
              ) : null}
            </div>
          </div>

          <div className="divide-y divide-white/[0.08] rounded-2xl border border-white/10 bg-background/40">
            {rows.map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-start gap-3.5 p-5">
                <Icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                    {label}
                  </p>
                  <p className="mt-1 whitespace-pre-line text-sm text-foreground/90">{value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}