import { createServerFn } from "@tanstack/react-start";

import {
  getRequest,
  getCookie,
  setResponseHeader,
} from "@tanstack/start-server-core";

const COOKIE_NAME = "vm_admin_session";

async function djangoRequest(path, options = {}) {
  const baseUrl = process.env.DJANGO_API_URL;
  const workerSecret = process.env.WORKER_SHARED_SECRET;

  if (!baseUrl || !workerSecret) {
    throw new Error("ConfiguraÃ§Ã£o da comunicaÃ§Ã£o com Django ausente.");
  }

  const request = getRequest();
  const cookie = getCookie(COOKIE_NAME);
  const origin = request.headers.get("origin");

  const headers = new Headers(options.headers || {});

  headers.set("X-Worker-Secret", workerSecret);
  headers.set("Accept", "application/json");

  if (cookie) {
    headers.set("Cookie", `${COOKIE_NAME}=${cookie}`);
  }

  if (origin) {
    headers.set("Origin", origin);
  }

  const response = await fetch(
    `${baseUrl.replace(/\/$/, "")}${path}`,
    {
      method: options.method || "GET",
      headers,
      body: options.body,
      redirect: "manual",
    },
  );

  const setCookie = response.headers.get("set-cookie");

  if (setCookie) {
    setResponseHeader("Set-Cookie", setCookie);
  }

  const data = await response.json();

  return {
    status: response.status,
    data,
  };
}

export const djangoAdminRequest = createServerFn({
  method: "POST",
})
  .validator((data) => data)
  .handler(async ({ data }) => {
    const allowedPaths = {
      status: "/api/admin/status/",
      setup: "/api/admin/setup/",
      login: "/api/admin/login/",
      logout: "/api/admin/logout/",
    };

    const path = allowedPaths[data.action];

    if (!path) {
      return {
        ok: false,
        error: "invalid_action",
      };
    }

    const method = data.action === "status" ? "GET" : "POST";

    const result = await djangoRequest(path, {
      method,
      body: method === "POST"
        ? JSON.stringify(data.payload || {})
        : undefined,
      headers: {
        "Content-Type": "application/json",
      },
    });

    return result.data;
  });

export async function djangoPublicRequest(action, params = {}) {
  const allowedPaths = {
    home: "/api/home/",
    vehicles: "/api/vehicles/",
    facets: "/api/vehicles/facets/",
    store: "/api/store/",
    leads: "/api/leads/",
  };

  let path;
  let method = "GET";
  let body;
  let headers = {};

  if (action === "vehicleDetail") {
    if (!params.id) {
      throw new Error("Identificador do veículo inválido.");
    }

    path = `/api/vehicles/${encodeURIComponent(String(params.id))}/`;
  } else {
    path = allowedPaths[action];
  }

  if (!path) {
    throw new Error("Ação pública inválida.");
  }

  if (action === "leads") {
    method = "POST";
    body = JSON.stringify(params);
    headers["Content-Type"] = "application/json";
  }

  const query = new URLSearchParams();

  if (method === "GET") {
    for (const [key, value] of Object.entries(params || {})) {
      if (
        action !== "vehicleDetail" &&
        value !== undefined &&
        value !== null &&
        value !== ""
      ) {
        query.set(key, String(value));
      }
    }
  }

  const queryString = query.toString();
  const url = queryString ? `${path}?${queryString}` : path;

  const result = await djangoRequest(url, {
    method,
    body,
    headers,
  });

  if (action === "vehicleDetail" && result.status === 404) {
    return null;
  }

  if (result.status < 200 || result.status >= 300) {
    throw new Error("Não foi possível carregar os dados públicos.");
  }

  return result.data;
}