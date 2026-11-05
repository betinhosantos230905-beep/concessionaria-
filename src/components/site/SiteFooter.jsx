import { Link } from "@tanstack/react-router";
import { Instagram, Facebook, MapPin, Clock, Phone, Lock } from "lucide-react";
import Brand from "@/components/site/Brand";
import { STORE_DEFAULTS } from "@/lib/storeDefaults";
import { whatsappLink, formatPhone } from "@/lib/format";

export default function SiteFooter({ store = STORE_DEFAULTS }) {
  const wa = whatsappLink(store.whatsapp, `Olá! Vim pelo site da ${store.name}.`);
  const year = 2026;

  return (
    <footer className="border-t border-white/10 bg-[#07080A]">
      <div className="shell grid gap-10 py-14 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <Brand store={store} />
          <p className="mt-5 max-w-sm text-sm leading-relaxed text-muted-foreground">
            {store.about_text}
          </p>
          <div className="mt-6 flex items-center gap-3">
            {store.instagram ? (
              <a
                href={`https://instagram.com/${String(store.instagram).replace("@", "")}`}
                target="_blank"
                rel="noreferrer"
                aria-label="Instagram"
                className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/[0.04] text-muted-foreground transition hover:border-primary/50 hover:text-primary"
              >
                <Instagram className="h-4 w-4" />
              </a>
            ) : null}
            {store.facebook ? (
              <a
                href={store.facebook}
                target="_blank"
                rel="noreferrer"
                aria-label="Facebook"
                className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/[0.04] text-muted-foreground transition hover:border-primary/50 hover:text-primary"
              >
                <Facebook className="h-4 w-4" />
              </a>
            ) : null}
          </div>
        </div>

        <div>
          <h3 className="font-mono text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
            Navegar
          </h3>
          <ul className="mt-5 space-y-3 text-sm">
            <li>
              <Link to="/veiculos" className="text-foreground/80 transition hover:text-primary">
                Estoque completo
              </Link>
            </li>
            <li>
              <Link to="/" hash="sobre" className="text-foreground/80 transition hover:text-primary">
                A loja
              </Link>
            </li>
            <li>
              <Link to="/" hash="contato" className="text-foreground/80 transition hover:text-primary">
                Contato
              </Link>
            </li>
            <li>
              <Link
                to="/admin/login"
                className="inline-flex items-center gap-1.5 text-muted-foreground transition hover:text-primary"
              >
                <Lock className="h-3 w-3" /> Painel da loja
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="font-mono text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
            Contato
          </h3>
          <ul className="mt-5 space-y-3 text-sm text-foreground/80">
            {store.address || store.city ? (
              <li className="flex gap-2.5">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>
                  {store.address}
                  {store.address && (store.city || store.state) ? " — " : ""}
                  {[store.city, store.state].filter(Boolean).join("/")}
                </span>
              </li>
            ) : null}
            {store.phone ? (
              <li className="flex gap-2.5">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <a href={`tel:${store.phone}`} className="transition hover:text-primary">
                  {formatPhone(store.phone)}
                </a>
              </li>
            ) : null}
            {store.opening_hours ? (
              <li className="flex gap-2.5">
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span className="whitespace-pre-line">{store.opening_hours}</span>
              </li>
            ) : null}
            {wa ? (
              <li>
                <a href={wa} target="_blank" rel="noreferrer" className="ghost-btn mt-1 w-full">
                  Falar no WhatsApp
                </a>
              </li>
            ) : null}
          </ul>
        </div>
      </div>

      <div className="border-t border-white/5">
        <div className="shell flex flex-col items-center justify-between gap-2 py-5 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70 sm:flex-row">
          <span>© {year} {store.name}. Todos os direitos reservados.</span>
          <span>Fotos meramente ilustrativas · Consulte disponibilidade</span>
        </div>
      </div>
    </footer>
  );
}