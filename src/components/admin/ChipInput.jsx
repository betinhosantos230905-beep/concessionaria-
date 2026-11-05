import { useState } from "react";
import { Plus, X } from "lucide-react";

export default function ChipInput({ value = [], onChange, placeholder }) {
  const [draft, setDraft] = useState("");

  const add = () => {
    const text = draft.trim();
    if (!text) return;
    if (value.some((item) => item.toLowerCase() === text.toLowerCase())) {
      setDraft("");
      return;
    }
    onChange([...value, text]);
    setDraft("");
  };

  return (
    <div>
      <div className="flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          placeholder={placeholder}
          className="field"
        />
        <button type="button" onClick={add} className="ghost-btn shrink-0 px-3" aria-label="Adicionar item">
          <Plus className="h-4 w-4" />
        </button>
      </div>

      {value.length ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {value.map((item) => (
            <span
              key={item}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[12px] text-foreground/85"
            >
              {item}
              <button
                type="button"
                onClick={() => onChange(value.filter((entry) => entry !== item))}
                aria-label={`Remover ${item}`}
                className="text-muted-foreground transition hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}