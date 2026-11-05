import { cn } from "@/lib/utils";

const TONES = {
  blue: "text-primary bg-primary/10 border-primary/20",
  green: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
  amber: "text-amber-400 bg-amber-400/10 border-amber-400/20",
  red: "text-rose-400 bg-rose-400/10 border-rose-400/20",
  gray: "text-muted-foreground bg-white/[0.04] border-white/10",
};

export default function StatCard({ label, value, icon: Icon, tone = "gray", hint }) {
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-card p-4 transition hover:border-white/15">
      <div className="flex items-start justify-between gap-3">
        <span className="font-mono text-[10px] uppercase leading-tight tracking-[0.18em] text-muted-foreground">
          {label}
        </span>
        {Icon ? (
          <span className={cn("grid h-8 w-8 shrink-0 place-items-center rounded-lg border", TONES[tone])}>
            <Icon className="h-4 w-4" />
          </span>
        ) : null}
      </div>
      <p className="mt-3 font-heading text-[26px] font-bold leading-none text-foreground">{value}</p>
      {hint ? <p className="mt-1.5 text-[11px] text-muted-foreground">{hint}</p> : null}
    </div>
  );
}