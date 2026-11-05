import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Loader2, SearchX } from "lucide-react";
import SiteHeader from "@/components/site/SiteHeader";
import SiteFooter from "@/components/site/SiteFooter";
import WhatsAppFab from "@/components/site/WhatsAppFab";
import VehicleCard from "@/components/site/VehicleCard";
import FilterPanel from "@/components/site/FilterPanel";
import { getCatalogFacets, getStore, searchVehicles } from "@/lib/public-fns";
import { STORE_DEFAULTS } from "@/lib/storeDefaults";

const toNum = (value) => {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : undefined;
};

export const Route = createFileRoute("/veiculos/")({
  validateSearch: (s) => ({
    q: s.q ? String(s.q).slice(0, 80) : undefined,
    brand: s.brand ? String(s.brand).slice(0, 60) : undefined,
    body_type: s.body_type ? String(s.body_type).slice(0, 40) : undefined,
    category: s.category ? String(s.category).slice(0, 40) : undefined,
    fuel: s.fuel ? String(s.fuel).slice(0, 30) : undefined,
    transmission: s.transmission ? String(s.transmission).slice(0, 30) : undefined,
    year_min: toNum(s.year_min),
    year_max: toNum(s.year_max),
    price_min: toNum(s.price_min),
    price_max: toNum(s.price_max),
    mileage_max: toNum(s.mileage_max),
    sort: ["recent", "price_asc", "price_desc", "km_asc"].includes(s.sort) ? s.sort : undefined,
  }),
  loaderDeps: ({ search }) => ({
    q: search.q,
    brand: search.brand,
    body_type: search.body_type,
    category: search.category,
    fuel: search.fuel,
    transmission: search.transmission,
    year_min: search.year_min,
    year_max: search.year_max,
    price_min: search.price_min,
    price_max: search.price_max,
    mileage_max: search.mileage_max,
    sort: search.sort,
  }),
  loader: async ({ deps }) => {
    const [result, facets, store] = await Promise.all([
      searchVehicles({ data: { ...deps, limit: 12 } }),
      getCatalogFacets(),
      getStore(),
    ]);
    return { result, facets, store };
  },
  head: () => ({
    meta: [
      { title: "Estoque de veículos — Vassouras Motos" },
      {
        name: "description",
        content:
          "Filtre o estoque por marca, carroceria, ano, preço, câmbio e quilometragem. Veículos com ficha técnica completa e fotos.",
      },
    ],
  }),
  component: CatalogPage,
});

const SORT_OPTIONS = [
  { value: "recent", label: "Mais recentes" },
  { value: "price_asc", label: "Menor preço" },
  { value: "price_desc", label: "Maior preço" },
  { value: "km_asc", label: "Menor quilometragem" },
];

const FILTER_KEYS = [
  "brand",
  "body_type",
  "category",
  "fuel",
  "transmission",
  "year_min",
  "year_max",
  "price_min",
  "price_max",
  "mileage_max",
];

const cleanSearch = (values) => {
  const out = {};
  Object.entries(values || {}).forEach(([key, value]) => {
    if (value !== "" && value !== undefined && value !== null) out[key] = value;
  });
  return out;
};

function CatalogPage() {
  const { result, facets, store } = Route.useLoaderData();
  const search = Route.useSearch();
  const navigate = useNavigate();

  const [items, setItems] = useState(result.items);
  const [cursor, setCursor] = useState(result.next_cursor);
  const [hasMore, setHasMore] = useState(result.has_more);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setItems(result.items);
    setCursor(result.next_cursor);
    setHasMore(result.has_more);
  }, [result]);

  const activeCount = FILTER_KEYS.filter((key) => search[key]).length;
  const storeData = store || STORE_DEFAULTS;

  const applyFilters = (values) => {
    navigate({
      to: "/veiculos",
      search: cleanSearch({ ...values, q: search.q, sort: search.sort }),
    });
  };

  const clearFilters = () => {
    navigate({ to: "/veiculos", search: cleanSearch({ q: search.q, sort: search.sort }) });
  };

  const changeSort = (event) => {
    navigate({ to: "/veiculos", search: cleanSearch({ ...search, sort: event.target.value }) });
  };

  const loadMore = async () => {
    if (!hasMore || loading) return;
    setLoading(true);
    try {
      const next = await searchVehicles({ data: { ...search, limit: 12, cursor } });
      setItems((prev) => [...prev, ...next.items]);
      setCursor(next.next_cursor);
      setHasMore(next.has_more);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader store={storeData} />
      <main className="pt-28">
        <div className="shell">
          <span className="eyebrow">estoque</span>
          <h1 className="mt-2 font-heading text-[clamp(1.9rem,4.4vw,3rem)] font-bold leading-tight text-foreground">
            {search.brand ? `${search.brand}` : "Todos os veículos"}
            {search.body_type ? ` · ${search.body_type}` : ""}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {result.total} {result.total === 1 ? "veículo encontrado" : "veículos encontrados"}
            {search.q ? ` para “${search.q}”` : ""}
          </p>
        </div>

        <div className="shell mt-8 grid gap-8 pb-20 lg:grid-cols-[288px_1fr]">
          <FilterPanel
            facets={facets}
            values={search}
            onChange={applyFilters}
            onClear={clearFilters}
            activeCount={activeCount}
          />

          <div>
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/[0.08] bg-card px-4 py-3">
              <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                ordenar por
              </span>
              <select
                value={search.sort || "recent"}
                onChange={changeSort}
                className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-foreground focus:border-primary/60 focus:outline-none"
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value} className="bg-background">
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {items.length ? (
              <>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                  {items.map((vehicle) => (
                    <VehicleCard key={vehicle.id} vehicle={vehicle} />
                  ))}
                </div>
                {hasMore ? (
                  <div className="mt-8 flex justify-center">
                    <button type="button" onClick={loadMore} disabled={loading} className="ghost-btn px-6">
                      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                      {loading ? "Carregando..." : "Carregar mais veículos"}
                    </button>
                  </div>
                ) : null}
              </>
            ) : (
              <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] px-6 py-20 text-center">
                <SearchX className="mx-auto h-9 w-9 text-muted-foreground/50" />
                <p className="mt-4 font-heading text-lg text-foreground">Nenhum veículo com esses filtros</p>
                <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
                  Tente ampliar a faixa de preço ou remover algum filtro.
                </p>
                <button type="button" onClick={clearFilters} className="primary-btn mt-6">
                  Limpar filtros
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
      <SiteFooter store={storeData} />
      <WhatsAppFab store={storeData} />
    </div>
  );
}