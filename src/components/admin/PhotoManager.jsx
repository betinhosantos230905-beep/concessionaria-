
import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight, ImagePlus, Loader2, Star, Trash2 } from "lucide-react";
import { adminUploadImage } from "@/lib/django-vehicle-fns";
import { Image } from "@/components/ui/image";

const MAX_PHOTOS = 12;
const MAX_BYTES = 15 * 1024 * 1024;
const ALLOWED = ["image/jpeg", "image/png", "image/webp"];

async function compress(file) {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1600 / bitmap.width);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.82).split(",")[1];
}

export default function PhotoManager({ images = [], onChange }) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const move = (index, delta) => {
    const next = [...images];
    const target = index + delta;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  const setMain = (index) => {
    if (index === 0) return;
    const next = [...images];
    const [item] = next.splice(index, 1);
    onChange([item, ...next]);
  };

  const remove = (index) => onChange(images.filter((_, i) => i !== index));

  const handleFiles = async (files) => {
    setError("");
    const list = Array.from(files || []);
    if (!list.length) return;

    if (images.length + list.length > MAX_PHOTOS) {
      setError(`Máximo de ${MAX_PHOTOS} fotos por veículo.`);
      return;
    }

    setUploading(true);
    const uploaded = [];

    try {
      for (const file of list) {
        if (!ALLOWED.includes(file.type)) {
          setError("Use imagens JPG, PNG ou WebP.");
          continue;
        }

        if (file.size > MAX_BYTES) {
          setError("Cada foto deve ter no máximo 15 MB.");
          continue;
        }

        const dataBase64 = await compress(file);

        const result = await adminUploadImage({
          data: {
            filename: `${Date.now()}-${file.name.replace(/[^\w.-]+/g, "-")}.jpg`,
            contentType: "image/jpeg",
            dataBase64,
            folder: "vehicles",
          },
        });

        if (result?.ok) {
          uploaded.push(result.url);
        } else {
          setError("Não foi possível enviar uma das fotos.");
        }
      }

      if (uploaded.length) {
        onChange([...images, ...uploaded]);
      }
    } catch {
      setError("Falha no envio das fotos. Tente novamente.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[13px] text-muted-foreground">
          A primeira foto é a principal do anúncio. Máximo de {MAX_PHOTOS} imagens.
        </p>

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="ghost-btn disabled:opacity-60"
        >
          {uploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ImagePlus className="h-4 w-4" />
          )}
          {uploading ? "Enviando..." : "Adicionar fotos"}
        </button>

        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          onChange={(e) => handleFiles(e.target.files)}
          className="hidden"
        />
      </div>

      {error ? (
        <p className="mt-2 text-[12px] text-destructive">{error}</p>
      ) : null}

      {images.length ? (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {images.map((src, index) => (
            <div
              key={`${src}-${index}`}
              className="group relative overflow-hidden rounded-xl border border-white/10 bg-secondary"
            >
              <Image
                src={src}
                alt={`Foto ${index + 1}`}
                className="aspect-[4/3] w-full object-cover"
              />

              {index === 0 ? (
                <span className="absolute left-2 top-2 rounded bg-primary px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-white">
                  principal
                </span>
              ) : null}

              <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 bg-black/65 p-1.5 backdrop-blur">
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => move(index, -1)}
                    disabled={index === 0}
                    aria-label="Mover para a esquerda"
                    className="grid h-7 w-7 place-items-center rounded bg-white/10 text-white transition hover:bg-white/20 disabled:opacity-30"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => move(index, 1)}
                    disabled={index === images.length - 1}
                    aria-label="Mover para a direita"
                    className="grid h-7 w-7 place-items-center rounded bg-white/10 text-white transition hover:bg-white/20 disabled:opacity-30"
                  >
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => setMain(index)}
                    aria-label="Definir como principal"
                    className="grid h-7 w-7 place-items-center rounded bg-white/10 text-white transition hover:bg-primary"
                  >
                    <Star className="h-3.5 w-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => remove(index)}
                    aria-label="Excluir foto"
                    className="grid h-7 w-7 place-items-center rounded bg-white/10 text-white transition hover:bg-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-4 rounded-xl border border-dashed border-white/15 bg-white/[0.02] px-4 py-10 text-center text-[13px] text-muted-foreground">
          Nenhuma foto adicionada. Anúncios com fotos recebem mais contatos.
        </div>
      )}
    </div>
  );
}
