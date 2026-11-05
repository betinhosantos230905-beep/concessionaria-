import { useState } from "react";
import { Loader2, CheckCircle2, Send } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { createLead } from "@/lib/public-fns";
import { carName } from "@/lib/format";

export default function LeadDialog({ vehicle, trigger }) {
  const [open, setOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ name: "", phone: "", email: "", message: "" });

  const set = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const submit = async (event) => {
    event.preventDefault();
    setSending(true);
    setError("");
    try {
      const result = await createLead({
        data: {
          ...form,
          vehicle_id: vehicle?.id || "",
          vehicle_label: carName(vehicle) + (vehicle?.year_model ? ` ${vehicle.year_model}` : ""),
        },
      });
      if (result.ok) {
        setDone(true);
        setForm({ name: "", phone: "", email: "", message: "" });
      } else {
        setError(result.error || "Não foi possível enviar. Tente novamente.");
      }
    } catch {
      setError("Não foi possível enviar. Tente novamente em instantes.");
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        setOpen(value);
        if (!value) {
          setDone(false);
          setError("");
        }
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[92vh] overflow-y-auto border-white/10 bg-card sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading text-lg text-foreground">
            {done ? "Contato enviado" : "Tenho interesse"}
          </DialogTitle>
        </DialogHeader>

        {done ? (
          <div className="py-6 text-center">
            <CheckCircle2 className="mx-auto h-10 w-10 text-primary" />
            <p className="mt-4 text-sm text-foreground">Recebemos seus dados.</p>
            <p className="mt-1 text-sm text-muted-foreground">
              A loja entrará em contato pelo telefone informado.
            </p>
            <button type="button" onClick={() => setOpen(false)} className="primary-btn mt-6 w-full">
              Fechar
            </button>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-3">
            {vehicle ? (
              <p className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-[13px] text-muted-foreground">
                Veículo: <span className="text-foreground">{carName(vehicle)}</span>
              </p>
            ) : null}

            <input required value={form.name} onChange={set("name")} placeholder="Seu nome" className="field" />
            <input
              required
              value={form.phone}
              onChange={set("phone")}
              placeholder="Telefone com DDD"
              inputMode="tel"
              className="field"
            />
            <input value={form.email} onChange={set("email")} placeholder="E-mail (opcional)" className="field" />
            <textarea
              value={form.message}
              onChange={set("message")}
              rows={3}
              placeholder="Mensagem (opcional)"
              className="field resize-none"
            />
            <input
              type="text"
              tabIndex={-1}
              autoComplete="off"
              value={form.website || ""}
              onChange={set("website")}
              className="hidden"
              aria-hidden="true"
            />

            {error ? <p className="text-[13px] text-destructive">{error}</p> : null}

            <button type="submit" disabled={sending} className="primary-btn w-full disabled:opacity-60">
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {sending ? "Enviando..." : "Enviar contato"}
            </button>
            <p className="text-center text-[11px] text-muted-foreground">
              Seus dados são usados apenas para este atendimento.
            </p>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}