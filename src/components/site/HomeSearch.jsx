import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Search, MessageCircle } from "lucide-react";
import { whatsappLink } from "@/lib/format";
import { STORE_DEFAULTS } from "@/lib/storeDefaults";

const QUICK = [
  { label: "SUV", search: { body_type: "SUV" } },
  { label: "Picape", search: { body_type: "Picape" } },
  { label: "Hatch", search: { body_type: "Hatch" } },
  { label: "Sedã", search: { body_type: "Sedan" } },
  { label: "Motos", search: { body_type: "Moto" } },
];

export default function HomeSearch({ store = STORE_DEFAULTS }) {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const wa = whatsappLink(store.whatsapp, `Olá! Vim pelo site da ${store.name}.`);

  const submit = (event) => {
    event.preventDefault();
    navigate({ to: "/veiculos", search: q.trim() ? { q: q.trim() } : {} });
  };

  return (
    <div className="w-full">
      <form
        onSubmit={submit}
        className="glass flex flex-col gap-2 rounded-2xl p-2 shadow-[0_30px_80px_-40px_rgba(0,0,0,0.9)] sm:flex-row sm:items-center sm:rounded-full sm:p-2"
      >
        <div className="flex flex-1 items-center gap-3 px-4 py-2.5">
          <Search className="h-[18px] w-[18px] shrink-0 text-primary" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Marca, modelo ou versão"
            aria-label="Buscar veículo"
            className="w-full bg-transparent text-[15px] text-foreground placeholder:text-muted-foreground/80 focus:outline-none"
          />
        </div>
        <button type="submit" className="primary-btn sm:rounded-full sm:px-7">
          Buscar no estoque
        </button>
      </form>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
          atalhos
        </span>
        {QUICK.map((item) => (
          <Link
            key={item.label}
            to="/veiculos"
            search={item.search}
            className="rounded-full border border-white/10 bg-white/[0.03] px-3.5 py-1.5 font-mono text-[11px] uppercase tracking-wider text-foreground/75 transition hover:border-primary/60 hover:text-primary"
          >
            {item.label}
          </Link>
        ))}
        {wa ? (
          <a
            href={wa}
            target="_blank"
            rel="noreferrer"
            className="ml-auto flex items-center gap-2 rounded-full border border-[#25D366]/40 bg-[#25D366]/10 px-3.5 py-1.5 font-mono text-[11px] uppercase tracking-wider text-[#4ade80] transition hover:bg-[#25D366]/20"
          >
            <MessageCircle className="h-3.5 w-3.5" /> falar agora
          </a>
        ) : null}
      </div>
    </div>
  );
}