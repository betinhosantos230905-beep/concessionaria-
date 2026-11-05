import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { clearToken, getToken } from "@/lib/adminSession";

/**
 * Carrega dados do painel de forma estável: a assinatura das dependências é
 * comparada por valor (string), evitando novas buscas a cada render.
 */
export function useAdminData(loader, deps = []) {
  const navigate = useNavigate();
  const signature = JSON.stringify(deps);
  const loaderRef = useRef(loader);
  const navigateRef = useRef(navigate);
  loaderRef.current = loader;
  navigateRef.current = navigate;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const result = await loaderRef.current(getToken());
      if (result?.ok === false && result?.error === "unauthorized") {
        clearToken();
        navigateRef.current({ to: "/admin/login", replace: true });
        return;
      }
      setData(result);
      setError("");
    } catch {
      setError("Não foi possível carregar os dados.");
    } finally {
      setLoading(false);
    }
  }, [signature]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { data, loading, error, reload };
}