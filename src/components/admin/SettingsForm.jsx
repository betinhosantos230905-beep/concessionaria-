import { useRef, useState } from "react";
import { Loader2, Save, Upload } from "lucide-react";
import { toast } from "sonner";
import { Image } from "@/components/ui/image";
import { adminSaveSettings, adminUploadImage } from "@/lib/admin-fns";
import { getToken } from "@/lib/adminSession";
import { ALLOWED_IMAGE_TYPES, MAX_IMAGE_BYTES, fileToJpegBase64 } from "@/lib/imageUpload";
import { STORE_DEFAULTS } from "@/lib/storeDefaults";

const FIELDS = [
  { key: "name", label: "Nome da loja", required: true },
  { key: "tagline", label: "Slogan curto" },
  { key: "whatsapp", label: "WhatsApp (só números, com DDD)", placeholder: "24999999999" },
  { key: "phone", label: "Telefone", placeholder: "2424710000" },
  { key: "address", label: "Endereço", full: true },
  { key: "city", label: "Cidade" },
  { key: "state", label: "Estado (UF)", maxLength: 2 },
  { key: "instagram", label: "Instagram (@usuario)" },
  { key: "facebook", label: "Facebook (link)" },
];

const IMAGE_FIELDS = [
  { key: "logo_url", label: "Logotipo" },
  { key: "hero_image", label: "Imagem da capa (home)" },
  { key: "store_image", label: "Imagem da seção “A loja”" },
];

function Label({ children }) {
  return (
    <span className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
      {children}
    </span>
  );
}

export default function SettingsForm({ initial }) {
  const [form, setForm] = useState(() => ({ ...STORE_DEFAULTS, ...(initial || {}) }));
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState("");
  const inputRefs = useRef({});

  const set = (key) => (event) => setForm((prev) => ({ ...prev, [key]: event.target.value }));

  const upload = async (key, file) => {
    if (!file) return;
    if (!ALLOWED_IMAGE_TYPES.includes(file.type) || file.size > MAX_IMAGE_BYTES) {
      toast.error("Use JPG, PNG ou WebP de até 15 MB.");
      return;
    }
    setUploading(key);
    try {
      const dataBase64 = await fileToJpegBase64(file);
      const result = await adminUploadImage({
        data: { token: getToken(), filename: `${key}.jpg`, contentType: "image/jpeg", dataBase64 },
      });
      if (result?.ok) setForm((prev) => ({ ...prev, [key]: result.url }));
      else toast.error("Falha no envio da imagem.");
    } catch {
      toast.error("Falha no envio da imagem.");
    } finally {
      setUploading("");
    }
  };

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const result = await adminSaveSettings({ data: { token: getToken(), data: form } });
      if (result?.ok) {
        toast.success("Configurações salvas.");
        setForm((prev) => ({ ...prev, ...result.settings }));
      } else {
        toast.error("Não foi possível salvar.");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="rounded-2xl border border-white/[0.08] bg-card p-5">
        <h2 className="font-heading text-sm font-semibold uppercase tracking-wider text-foreground">
          Identidade e imagens
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {IMAGE_FIELDS.map(({ key, label }) => (
            <div key={key}>
              <Label>{label}</Label>
              <div className="overflow-hidden rounded-xl border border-white/10 bg-secondary">
                <Image src={form[key] || STORE_DEFAULTS[key]} alt={label} className="aspect-[4/3] w-full object-cover" />
              </div>
              <input
                ref={(el) => {
                  inputRefs.current[key] = el;
                }}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => upload(key, e.target.files?.[0])}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => inputRefs.current[key]?.click()}
                disabled={uploading === key}
                className="ghost-btn mt-2 w-full py-2 text-xs"
              >
                {uploading === key ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Upload className="h-3.5 w-3.5" />
                )}
                Trocar imagem
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-white/[0.08] bg-card p-5">
        <h2 className="font-heading text-sm font-semibold uppercase tracking-wider text-foreground">
          Dados da loja
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {FIELDS.map((field) => (
            <label key={field.key} className={field.full ? "block sm:col-span-2" : "block"}>
              <Label>
                {field.label}
                {field.required ? " *" : ""}
              </Label>
              <input
                value={form[field.key] || ""}
                onChange={set(field.key)}
                placeholder={field.placeholder}
                maxLength={field.maxLength}
                required={field.required}
                className="field"
              />
            </label>
          ))}
          <label className="block sm:col-span-2">
            <Label>Horários de atendimento</Label>
            <textarea
              value={form.opening_hours || ""}
              onChange={set("opening_hours")}
              rows={2}
              placeholder="Seg a sex: 8h às 18h&#10;Sábado: 8h às 13h"
              className="field resize-y"
            />
          </label>
          <label className="block sm:col-span-2">
            <Label>Texto institucional</Label>
            <textarea
              value={form.about_text || ""}
              onChange={set("about_text")}
              rows={4}
              className="field resize-y"
            />
          </label>
        </div>
      </div>

      <button type="submit" disabled={saving} className="primary-btn w-full sm:w-auto disabled:opacity-60">
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        {saving ? "Salvando..." : "Salvar configurações"}
      </button>
    </form>
  );
}