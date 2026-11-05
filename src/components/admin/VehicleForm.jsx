import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Loader2, Save, ArrowLeft, Star } from "lucide-react";
import { toast } from "sonner";
import ChipInput from "@/components/admin/ChipInput";
import PhotoManager from "@/components/admin/PhotoManager";
import { adminSaveVehicle } from "@/lib/admin-fns";
import { getToken } from "@/lib/adminSession";
import { BRANDS, BODY_TYPES, CATEGORIES, FUEL_TYPES, TRANSMISSIONS, VEHICLE_STATUS } from "@/lib/storeDefaults";

const EMPTY = {
  brand: "",
  model: "",
  version: "",
  year_manufacture: "",
  year_model: "",
  price: "",
  mileage: "",
  fuel: "Flex",
  transmission: "Automático",
  color: "",
  category: "Seminovo",
  body_type: "Hatch",
  doors: "4",
  engine: "",
  power: "",
  description: "",
  features: [],
  equipment: [],
  notes: "",
  status: "available",
  featured: false,
  images: [],
};

const toInitial = (vehicle) => {
  if (!vehicle) return EMPTY;
  return {
    ...EMPTY,
    ...vehicle,
    year_manufacture: vehicle.year_manufacture ?? "",
    year_model: vehicle.year_model ?? "",
    price: vehicle.price ?? "",
    mileage: vehicle.mileage ?? "",
    doors: vehicle.doors ?? "",
    features: vehicle.features || [],
    equipment: vehicle.equipment || [],
    images: vehicle.images || [],
  };
};

function Section({ title, description, children }) {
  return (
    <section className="rounded-2xl border border-white/[0.08] bg-card p-5">
      <h2 className="font-heading text-sm font-semibold uppercase tracking-wider text-foreground">{title}</h2>
      {description ? <p className="mt-1 text-[12px] text-muted-foreground">{description}</p> : null}
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Label({ children }) {
  return (
    <span className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
      {children}
    </span>
  );
}

export default function VehicleForm({ vehicle }) {
  const navigate = useNavigate();
  const [form, setForm] = useState(() => toInitial(vehicle));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const set = (key) => (event) => setForm((prev) => ({ ...prev, [key]: event.target.value }));
  const setValue = (key) => (value) => setForm((prev) => ({ ...prev, [key]: value }));

  const submit = async (event) => {
    event.preventDefault();
    setError("");

    if (!form.brand || !form.model) return setError("Informe marca e modelo.");
    if (!form.year_model) return setError("Informe o ano do modelo.");
    if (!form.price) return setError("Informe o preço do veículo.");

    const payload = {
      ...form,
      brand: form.brand.trim(),
      model: form.model.trim(),
      version: form.version.trim(),
      price: Number(form.price) || 0,
      mileage: Number(form.mileage) || 0,
      year_manufacture: form.year_manufacture ? Number(form.year_manufacture) : null,
      year_model: Number(form.year_model),
      doors: form.doors === "" ? null : Number(form.doors),
    };

    setSaving(true);
    try {
      const result = await adminSaveVehicle({
        data: { token: getToken(), id: vehicle?.id, data: payload },
      });
      if (result?.ok) {
        toast.success(vehicle ? "Anúncio atualizado." : "Veículo cadastrado.");
        navigate({ to: "/admin/veiculos" });
      } else {
        setError("Não foi possível salvar. Verifique os campos e tente novamente.");
      }
    } catch {
      setError("Não foi possível salvar. Tente novamente.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4 pb-24 lg:pb-0">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button type="button" onClick={() => navigate({ to: "/admin/veiculos" })} className="ghost-btn">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </button>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setValue("featured")(!form.featured)}
            className={`ghost-btn ${form.featured ? "border-primary/60 text-primary" : ""}`}
          >
            <Star className={`h-4 w-4 ${form.featured ? "fill-primary" : ""}`} />
            {form.featured ? "Em destaque" : "Destacar"}
          </button>
          <button type="submit" disabled={saving} className="primary-btn disabled:opacity-60">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? "Salvando..." : "Salvar anúncio"}
          </button>
        </div>
      </div>

      {error ? (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-[13px] text-destructive">
          {error}
        </p>
      ) : null}

      <Section title="Informações principais">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <Label>Marca *</Label>
            <input
              list="brand-options"
              value={form.brand}
              onChange={set("brand")}
              placeholder="Ex: Jeep"
              className="field"
            />
            <datalist id="brand-options">
              {BRANDS.map((brand) => (
                <option key={brand} value={brand} />
              ))}
            </datalist>
          </label>
          <label className="block">
            <Label>Modelo *</Label>
            <input value={form.model} onChange={set("model")} placeholder="Ex: Compass" className="field" />
          </label>
          <label className="block sm:col-span-2">
            <Label>Versão</Label>
            <input
              value={form.version}
              onChange={set("version")}
              placeholder="Ex: 1.3 T270 Longitude"
              className="field"
            />
          </label>
          <label className="block">
            <Label>Ano de fabricação</Label>
            <input
              type="number"
              inputMode="numeric"
              value={form.year_manufacture}
              onChange={set("year_manufacture")}
              placeholder="2022"
              className="field"
            />
          </label>
          <label className="block">
            <Label>Ano do modelo *</Label>
            <input
              type="number"
              inputMode="numeric"
              value={form.year_model}
              onChange={set("year_model")}
              placeholder="2023"
              className="field"
            />
          </label>
          <label className="block">
            <Label>Preço (R$) *</Label>
            <input
              type="number"
              inputMode="decimal"
              step="0.01"
              value={form.price}
              onChange={set("price")}
              placeholder="129900"
              className="field"
            />
          </label>
          <label className="block">
            <Label>Quilometragem</Label>
            <input
              type="number"
              inputMode="numeric"
              value={form.mileage}
              onChange={set("mileage")}
              placeholder="41200"
              className="field"
            />
          </label>
        </div>
      </Section>

      <Section title="Características">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <Label>Combustível</Label>
            <select value={form.fuel} onChange={set("fuel")} className="field">
              {FUEL_TYPES.map((item) => (
                <option key={item} value={item} className="bg-background">
                  {item}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <Label>Câmbio</Label>
            <select value={form.transmission} onChange={set("transmission")} className="field">
              {TRANSMISSIONS.map((item) => (
                <option key={item} value={item} className="bg-background">
                  {item}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <Label>Categoria</Label>
            <select value={form.category} onChange={set("category")} className="field">
              {CATEGORIES.map((item) => (
                <option key={item} value={item} className="bg-background">
                  {item}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <Label>Carroceria</Label>
            <select value={form.body_type} onChange={set("body_type")} className="field">
              {BODY_TYPES.map((item) => (
                <option key={item} value={item} className="bg-background">
                  {item}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <Label>Cor</Label>
            <input value={form.color} onChange={set("color")} placeholder="Prata" className="field" />
          </label>
          <label className="block">
            <Label>Número de portas</Label>
            <input
              type="number"
              inputMode="numeric"
              value={form.doors}
              onChange={set("doors")}
              placeholder="4"
              className="field"
            />
          </label>
          <label className="block">
            <Label>Motor</Label>
            <input value={form.engine} onChange={set("engine")} placeholder="1.3 Turbo" className="field" />
          </label>
          <label className="block">
            <Label>Potência</Label>
            <input value={form.power} onChange={set("power")} placeholder="185 cv" className="field" />
          </label>
        </div>
      </Section>

      <Section title="Descrição e opcionais">
        <div className="space-y-4">
          <label className="block">
            <Label>Descrição</Label>
            <textarea
              value={form.description}
              onChange={set("description")}
              rows={5}
              placeholder="Histórico, estado de conservação, revisões, detalhes do veículo..."
              className="field resize-y"
            />
          </label>
          <div>
            <Label>Opcionais</Label>
            <ChipInput
              value={form.features}
              onChange={setValue("features")}
              placeholder="Ex: Ar-condicionado, Direção elétrica, Multimídia"
            />
          </div>
          <div>
            <Label>Equipamentos</Label>
            <ChipInput
              value={form.equipment}
              onChange={setValue("equipment")}
              placeholder="Ex: Central multimídia 8'', Câmera de ré, Sensor de estacionamento"
            />
          </div>
          <label className="block">
            <Label>Observações internas</Label>
            <textarea
              value={form.notes}
              onChange={set("notes")}
              rows={3}
              placeholder="Visível apenas no painel"
              className="field resize-y"
            />
          </label>
        </div>
      </Section>

      <Section title="Configurações do anúncio" description="Define como o veículo aparece na vitrine.">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <Label>Status</Label>
            <select value={form.status} onChange={set("status")} className="field">
              {VEHICLE_STATUS.map((item) => (
                <option key={item.value} value={item.value} className="bg-background">
                  {item.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex cursor-pointer items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
            <span className="text-[13px] text-foreground/85">Exibir em destaque na home</span>
            <input
              type="checkbox"
              checked={form.featured}
              onChange={(e) => setValue("featured")(e.target.checked)}
              className="h-5 w-5 accent-[hsl(var(--primary))]"
            />
          </label>
        </div>
      </Section>

      <Section title="Fotografias" description="Envie várias fotos, escolha a principal e ordene a galeria.">
        <PhotoManager images={form.images} onChange={setValue("images")} />
      </Section>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-background/95 px-4 py-3 backdrop-blur lg:static lg:border-0 lg:bg-transparent lg:p-0">
        <button type="submit" disabled={saving} className="primary-btn w-full lg:ml-auto lg:w-auto disabled:opacity-60">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saving ? "Salvando..." : "Salvar anúncio"}
        </button>
      </div>
    </form>
  );
}