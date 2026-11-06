import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { djangoAdminRequest } from "@/lib/django-proxy.server";

export const adminStatus = createServerFn({ method: "POST" })
  .validator(z.object({}))
  .handler(async () => {
    const result = await djangoAdminRequest({
      data: { action: "status" },
    });

    return {
      configured: Boolean(result.configured),
      valid: Boolean(result.authenticated),
    };
  });

export const adminSetup = createServerFn({ method: "POST" })
  .validator(z.object({
    password: z.string().min(8).max(200),
  }))
  .handler(async ({ data }) => {
    return djangoAdminRequest({
      data: {
        action: "setup",
        payload: { password: data.password },
      },
    });
  });

export const adminLogin = createServerFn({ method: "POST" })
  .validator(z.object({
    password: z.string().min(1).max(200),
  }))
  .handler(async ({ data }) => {
    return djangoAdminRequest({
      data: {
        action: "login",
        payload: { password: data.password },
      },
    });
  });


export const adminLogout = createServerFn({ method: "POST" })
  .validator(z.object({}))
  .handler(async () => {
    return djangoAdminRequest({
      data: { action: "logout" },
    });
  });

