import { useState } from "react";
import { ChevronLeft, ChevronRight, Bike } from "lucide-react";
import { Image } from "@/components/ui/image";

export default function VehicleGallery({ images = [], alt = "Veículo" }) {
  const [index, setIndex] = useState(0);
  const list = images.filter(Boolean);
  const total = list.length;

  const go = (delta) => setIndex((prev) => (prev + delta + total) % total);

  if (!total) {
    return (
      <div className="grid aspect-[16/10] w-full place-items-center rounded-2xl border border-white/10 bg-secondary text-muted-foreground/40">
        <Bike className="h-12 w-12" />
      </div>
    );
  }

  return (
    <div>
      <div className="group relative aspect-[16/10] overflow-hidden rounded-2xl border border-white/10 bg-secondary">
        <Image
          key={list[index]}
          src={list[index]}
          alt={`${alt} — foto ${index + 1}`}
          className="h-full w-full object-cover"
        />
        {total > 1 ? (
          <>
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label="Foto anterior"
              className="absolute left-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-white/20 bg-black/50 text-white opacity-0 backdrop-blur transition hover:bg-black/70 group-hover:opacity-100 max-sm:opacity-100"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              aria-label="Próxima foto"
              className="absolute right-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-white/20 bg-black/50 text-white opacity-0 backdrop-blur transition hover:bg-black/70 group-hover:opacity-100 max-sm:opacity-100"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
            <span className="absolute bottom-3 right-3 rounded-md border border-white/15 bg-black/60 px-2 py-1 font-mono text-[11px] text-white/90 backdrop-blur">
              {index + 1} / {total}
            </span>
          </>
        ) : null}
      </div>

      {total > 1 ? (
        <div className="no-scrollbar mt-3 flex gap-2.5 overflow-x-auto pb-1">
          {list.map((src, i) => (
            <button
              key={`${src}-${i}`}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Ver foto ${i + 1}`}
              className={`relative h-16 w-24 shrink-0 overflow-hidden rounded-lg border transition ${
                i === index ? "border-primary ring-2 ring-primary/30" : "border-white/10 opacity-60 hover:opacity-100"
              }`}
            >
              <Image src={src} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}