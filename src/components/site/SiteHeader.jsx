import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Menu, X, MessageCircle } from "lucide-react";
import Brand from "@/components/site/Brand";
import { STORE_DEFAULTS } from "@/lib/storeDefaults";
import { whatsappLink } from "@/lib/format";
import { cn } from "@/lib/utils";

const NAV = [
  { label: "Estoque", to: "/veiculos" },
  { label: "A loja", to: "/", hash: "sobre" },
  { label: "Contato", to: "/", hash: "contato" },
];

export default function SiteHeader({ store = STORE_DEFAULTS }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const wa = whatsappLink(store.whatsapp, `Olá! Vim pelo site da ${store.name}.`);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-500",
        scrolled ? "border-b border-white/10 bg-background/85 backdrop-blur-xl" : "bg-gradient-to-b from-black/70 to-transparent"
      )}
    >
      <div className="shell flex h-[76px] items-center justify-between">
        <Brand store={store} />

        <nav className="hidden items-center gap-9 md:flex">
          {NAV.map((item) => (
            <Link
              key={item.label}
              to={item.to}
              hash={item.hash}
              className="relative font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground transition after:absolute after:-bottom-2 after:left-0 after:h-px after:w-0 after:bg-primary after:transition-all hover:text-foreground hover:after:w-full"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:block">
          {wa ? (
            <a href={wa} target="_blank" rel="noreferrer" className="primary-btn">
              <MessageCircle className="h-4 w-4" />
              WhatsApp
            </a>
          ) : (
            <Link to="/veiculos" className="primary-btn">
              Ver estoque
            </Link>
          )}
        </div>

        <button
          type="button"
          aria-label="Abrir menu"
          onClick={() => setOpen((v) => !v)}
          className="grid h-11 w-11 place-items-center rounded-xl border border-white/12 bg-white/5 text-foreground md:hidden"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      <div
        className={cn(
          "overflow-hidden border-t border-white/5 bg-background/95 backdrop-blur-xl transition-[max-height] duration-500 md:hidden",
          open ? "max-h-80" : "max-h-0"
        )}
      >
        <div className="shell flex flex-col gap-1 py-4">
          {NAV.map((item) => (
            <Link
              key={item.label}
              to={item.to}
              hash={item.hash}
              onClick={() => setOpen(false)}
              className="rounded-lg px-2 py-3 font-heading text-base font-medium text-foreground/90 transition hover:bg-white/5"
            >
              {item.label}
            </Link>
          ))}
          <a
            href={wa || "/veiculos"}
            target={wa ? "_blank" : undefined}
            rel="noreferrer"
            onClick={() => setOpen(false)}
            className="primary-btn mt-2"
          >
            <MessageCircle className="h-4 w-4" />
            {wa ? "Falar no WhatsApp" : "Ver estoque"}
          </a>
        </div>
      </div>
    </header>
  );
}