import { useEffect, useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { BRANDS, BODY_TYPES, CATEGORIES, FUEL_TYPES, TRANSMISSIONS } from "@/lib/storeDefaults";

const CURRENT_YEAR = 2026;

const EMPTY = {
  brand: "",
  body_type: "",
  category: "",
  fuel: "",
  transmission: "",
  year_min: "",
  year_max: "",
  price_min: "",
  price_max: "",
  mileage_max: "",
};

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}

function Select({ value, onChange, options, placeholder }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className="field appearance-none">
      <option value="">{placeholder}</option>
      {options.map((option) => (
        <option key={option} value={option} className="bg-background">
          {option}
        </option>
      ))}
    </select>
  );
}

function FiltersForm({ values, facets, onApply, onClear }) {
  const [draft, setDraft] = useState({ ...EMPTY, ...values });
  const signature = JSON.stringify(values || {});
  useEffect(() => {
    setDraft({ ...EMPTY, ...JSON.parse(signature) });
  }, [signature]);

  const set = (key) => (value) => setDraft((prev) => ({ ...prev, [key]: value }));
  const brands = facets?.brands?.length ? facets.brands : BRANDS;

  return (
    <div className="space-y-5">
      <Field label="Marca">
        <Select value={draft.brand} onChange={set("brand")} options={brands} placeholder="Todas" />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Categoria">
          <Select value={draft.category} onChange={set("category")} options={CATEGORIES} placeholder="Todas" />
        </Field>
        <Field label="Carroceria">
          <Select value={draft.body_type} onChange={set("body_type")} options={BODY_TYPES} placeholder="Todas" />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Câmbio">
          <Select value={draft.transmission} onChange={set("transmission")} options={TRANSMISSIONS} placeholder="Todos" />
        </Field>
        <Field label="Combustível">
          <Select value={draft.fuel} onChange={set("fuel")} options={FUEL_TYPES} placeholder="Todos" />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Ano de">
          <input
            type="number"
            inputMode="numeric"
            placeholder="2005"
            value={draft.year_min}
            onChange={(e) => set("year_min")(e.target.value)}
            className="field"
          />
        </Field>
        <Field label="Ano até">
          <input
            type="number"
            inputMode="numeric"
            placeholder={String(CURRENT_YEAR)}
            value={draft.year_max}
            onChange={(e) => set("year_max")(e.target.value)}
            className="field"
          />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Preço de">
          <input
            type="number"
            inputMode="numeric"
            placeholder="0"
            value={draft.price_min}
            onChange={(e) => set("price_min")(e.target.value)}
            className="field"
          />
        </Field>
        <Field label="Preço até">
          <input
            type="number"
            inputMode="numeric"
            placeholder="500000"
            value={draft.price_max}
            onChange={(e) => set("price_max")(e.target.value)}
            className="field"
          />
        </Field>
      </div>

      <Field label="Quilometragem máxima">
        <input
          type="number"
          inputMode="numeric"
          placeholder="100000"
          value={draft.mileage_max}
          onChange={(e) => set("mileage_max")(e.target.value)}
          className="field"
        />
      </Field>

      <div className="flex gap-2 pt-1">
        <button type="button" onClick={() => onApply(draft)} className="primary-btn flex-1">
          Aplicar filtros
        </button>
        <button
          type="button"
          onClick={() => {
            setDraft(EMPTY);
            onClear();
          }}
          className="ghost-btn"
          aria-label="Limpar filtros"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export default function FilterPanel({ facets, values, onChange, onClear, activeCount }) {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <div className="hidden lg:block">
        <div className="sticky top-24 rounded-2xl border border-white/[0.08] bg-card p-5">
          <div className="mb-5 flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-primary" />
            <h2 className="font-heading text-sm font-semibold uppercase tracking-wider text-foreground">
              Filtros
            </h2>
          </div>
          <FiltersForm values={values} facets={facets} onApply={onChange} onClear={onClear} />
        </div>
      </div>

      <div className="lg:hidden">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <button type="button" className="ghost-btn w-full">
              <SlidersHorizontal className="h-4 w-4 text-primary" />
              Filtros
              {activeCount ? (
                <span className="ml-1 rounded-full bg-primary px-2 py-0.5 font-mono text-[10px] text-white">
                  {activeCount}
                </span>
              ) : null}
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto rounded-t-3xl border-white/10 bg-card">
            <SheetHeader className="text-left">
              <SheetTitle className="font-heading text-base">Filtrar estoque</SheetTitle>
            </SheetHeader>
            <div className="mt-4 pb-6">
              <FiltersForm
                values={values}
                facets={facets}
                onApply={(next) => {
                  onChange(next);
                  setOpen(false);
                }}
                onClear={() => {
                  onClear();
                  setOpen(false);
                }}
              />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}