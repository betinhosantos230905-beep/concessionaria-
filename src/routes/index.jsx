import { createFileRoute } from "@tanstack/react-router";
import SiteHeader from "@/components/site/SiteHeader";
import SiteFooter from "@/components/site/SiteFooter";
import WhatsAppFab from "@/components/site/WhatsAppFab";
import Hero from "@/components/site/home/Hero";
import CatalogSection from "@/components/site/home/CatalogSection";
import AboutSection from "@/components/site/home/AboutSection";
import ContactSection from "@/components/site/home/ContactSection";
import { getHomeData } from "@/lib/public-fns";
import { STORE_DEFAULTS } from "@/lib/storeDefaults";

export const Route = createFileRoute("/")({
  loader: async () => getHomeData(),
  head: () => ({
    meta: [
      { title: "Vassouras Motos — Veículos selecionados em Vassouras, RJ" },
      {
        name: "description",
        content:
          "Estoque de veículos novos e seminovos em Vassouras, RJ. Fotos, ficha técnica completa, filtros por marca, preço e câmbio, e contato direto pelo WhatsApp.",
      },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const data = Route.useLoaderData();
  console.log("DADOS DA HOME:", data);
  const store = data.store ? { ...STORE_DEFAULTS, ...data.store } : STORE_DEFAULTS;
  const featured = data.featured?.length ? data.featured : data.latest.slice(0, 3);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader store={store} />
      <main>
        <Hero store={store} total={data.total} />
        <CatalogSection
          eyebrow="seleção da loja"
          title="Destaques do estoque"
          description="Os veículos escolhidos pela nossa equipe para você ver primeiro."
          vehicles={featured}
          action={{ label: "Ver todo o estoque", to: "/veiculos" }}
        />
        <CatalogSection
          eyebrow="estoque"
          title="Chegaram na loja"
          description="Anúncios ativos, com fotos e ficha técnica completa."
          vehicles={data.latest}
          action={{ label: "Filtrar estoque", to: "/veiculos" }}
        />
        <AboutSection store={store} />
        <ContactSection store={store} />
      </main>
      <SiteFooter store={store} />
      <WhatsAppFab store={store} />
    </div>
  );
}