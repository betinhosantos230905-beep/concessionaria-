import { useState } from "react";
import { Phone, MessageCircle, Loader2, Check } from "lucide-react";
import { toast } from "sonner";
import { adminUpdateLead } from "@/lib/admin-fns";
import { getToken } from "@/lib/adminSession";
import { formatDate, formatPhone, onlyDigits } from "@/lib/format";
import { LEAD_STATUS } from "@/lib/storeDefaults";

const STYLE = {
  new: "border-primary/40 bg-primary/10 text-primary",
  in_progress: "border-amber-400/40 bg-amber-400/10 text-amber-400",
  done: "border-emerald-400/40 bg-emerald-400/10 text-emerald-400",
};

export default function LeadCard({ lead, onChanged }) {
  const [notes, setNotes] = useState(lead.internal_notes || "");
  const [saving, setSaving] = useState(false);
  const digits = onlyDigits(lead.phone);

  const update = async (patch) => {
    setSaving(true);
    try {
      const result = await adminUpdateLead({ data: { token: getToken(), id: lead.id, patch } });
      if (result?.ok) {
        toast.success("Atendimento atualizado.");
        onChanged?.();
      } else {
        toast.error("Não foi possível atualizar.");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-heading text-[15px] font-semibold text-foreground">{lead.name}</p>
          <p className="text-[12px] text-muted-foreground">{formatPhone(lead.phone)}</p>
        </div>
        <span
          className={`rounded-md border px-2 py-1 font-mono text-[10px] uppercase tracking-wider ${
            STYLE[lead.status] || STYLE.new
          }`}
        >
          {LEAD_STATUS.find((s) => s.value === lead.status)?.label || lead.status}
        </span>
      </div>

      {lead.vehicle_label ? (
        <p className="mt-3 inline-flex rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1.5 text-[12px] text-foreground/80">
          Interesse: {lead.vehicle_label}
        </p>
      ) : (
        <p className="mt-3 text-[12px] text-muted-foreground">Contato geral pelo site</p>
      )}

      {lead.message ? (
        <p className="mt-3 whitespace-pre-line rounded-lg bg-white/[0.02] p-3 text-[13px] leading-relaxed text-muted-foreground">
          {lead.message}
        </p>
      ) : null}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <a href={`tel:${lead.phone}`} className="ghost-btn px-3 py-2 text-xs">
          <Phone className="h-3.5 w-3.5" /> Ligar
        </a>
        {digits ? (
          <a
            href={`https://wa.me/${digits.length <= 11 ? `55${digits}` : digits}`}
            target="_blank"
            rel="noreferrer"
            className="ghost-btn px-3 py-2 text-xs"
          >
            <MessageCircle className="h-3.5 w-3.5 text-[#25D366]" /> WhatsApp
          </a>
        ) : null}
        <span className="ml-auto font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          {formatDate(lead.created_date)}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5 border-t border-white/[0.06] pt-3">
        {LEAD_STATUS.map((option) => (
          <button
            key={option.value}
            type="button"
            disabled={saving || lead.status === option.value}
            onClick={() => update({ status: option.value })}
            className={`rounded-lg px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-wider transition ${
              lead.status === option.value
                ? "bg-white/10 text-foreground"
                : "text-muted-foreground hover:bg-white/[0.06] hover:text-foreground"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className="mt-2 flex gap-2">
        <input
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Anotação do atendimento"
          className="field py-2 text-[13px]"
        />
        <button
          type="button"
          disabled={saving}
          onClick={() => update({ internal_notes: notes })}
          aria-label="Salvar anotação"
          className="ghost-btn shrink-0 px-3 py-2"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}