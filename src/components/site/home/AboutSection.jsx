import { Image } from "@/components/ui/image";
import { STORE_DEFAULTS } from "@/lib/storeDefaults";
import { Check } from "lucide-react";

const PILLARS = [
  { title: "Procedência verificada", text: "Documentação e histórico conferidos antes de anunciar." },
  { title: "Ficha técnica transparente", text: "Todos os dados do veículo publicados, sem surpresas." },
  { title: "Atendimento direto", text: "Você fala com quem cuida do estoque, não com um robô." },
];

export default function AboutSection({ store = STORE_DEFAULTS }) {
  return (
    <section id="sobre" className="relative border-y border-white/[0.07] bg-[#0B0C0F] py-16 sm:py-24">
      <div className="shell grid items-center gap-12 lg:grid-cols-2">
        <div className="relative">
          <div className="overflow-hidden rounded-2xl border border-white/10">
            <Image
              src={store.store_image || STORE_DEFAULTS.store_image}
              alt={`Loja ${store.name}`}
              className="aspect-[4/3] w-full object-cover"
            />
          </div>
          <div className="absolute -bottom-6 left-6 right-6 rounded-xl border border-white/10 bg-background/90 p-4 backdrop-blur-xl sm:left-8 sm:right-auto sm:w-64">
            <span className="eyebrow">a loja</span>
            <p className="mt-1.5 font-heading text-lg font-semibold text-foreground">
              {store.name}
            </p>
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              {[store.city, store.state].filter(Boolean).join(" / ")}
            </p>
          </div>
        </div>

        <div className="mt-8 lg:mt-0">
          <span className="eyebrow">sobre nós</span>
          <h2 className="mt-3 font-heading text-[clamp(1.7rem,3.6vw,2.6rem)] font-bold leading-tight text-foreground">
            Compramos e vendemos com o cuidado de quem vai usar.
          </h2>
          <p className="mt-5 text-[15px] leading-relaxed text-muted-foreground">{store.about_text}</p>

          <ul className="mt-8 space-y-5">
            {PILLARS.map((item) => (
              <li key={item.title} className="flex gap-3.5">
                <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary/15 text-primary">
                  <Check className="h-3.5 w-3.5" />
                </span>
                <div>
                  <p className="font-heading text-[15px] font-semibold text-foreground">{item.title}</p>
                  <p className="text-sm text-muted-foreground">{item.text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}