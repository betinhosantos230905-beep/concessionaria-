import { Link } from "@tanstack/react-router";
import { STORE_DEFAULTS } from "@/lib/storeDefaults";
import { cn } from "@/lib/utils";

export default function Brand({ store = STORE_DEFAULTS, size = "md", className }) {
  const logo = store.logo_url || STORE_DEFAULTS.logo_url;
  const dims = size === "sm" ? "h-10 w-10" : "h-12 w-12";

  return (
    <Link to="/" className={cn("group flex items-center gap-3", className)}>
      <span
        className={cn(
          "relative shrink-0 overflow-hidden rounded-full border border-white/15 bg-white/5 ring-1 ring-primary/30 transition group-hover:ring-primary/70",
          dims
        )}
      >
        <img src={logo} alt={`Logotipo ${store.name}`} className="h-full w-full object-cover" />
      </span>
      <span className="leading-none">
        <span className="block font-heading text-[15px] font-bold uppercase tracking-[0.16em] text-foreground">
          {store.name}
        </span>
        <span className="mt-1.5 block font-mono text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
          {store.tagline || "Veículos selecionados"}
        </span>
      </span>
    </Link>
  );
}