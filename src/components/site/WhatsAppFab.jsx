import { MessageCircle } from "lucide-react";
import { whatsappLink } from "@/lib/format";
import { STORE_DEFAULTS } from "@/lib/storeDefaults";

export default function WhatsAppFab({ store = STORE_DEFAULTS, message }) {
  const href = whatsappLink(
    store.whatsapp,
    message || `Olá! Vim pelo site da ${store.name} e gostaria de mais informações.`
  );
  if (!href) return null;

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label="Falar no WhatsApp"
      className="group fixed bottom-5 right-5 z-40 flex items-center gap-2.5 rounded-full bg-[#25D366] px-4 py-3.5 font-semibold text-[#04331b] shadow-[0_18px_40px_-14px_rgba(37,211,102,0.85)] transition duration-300 hover:scale-[1.04] hover:shadow-[0_22px_48px_-14px_rgba(37,211,102,0.95)]"
    >
      <span className="absolute inset-0 -z-10 animate-ping rounded-full bg-[#25D366]/40 [animation-duration:3s]" />
      <MessageCircle className="h-5 w-5" />
      <span className="hidden text-sm sm:block">WhatsApp</span>
    </a>
  );
}