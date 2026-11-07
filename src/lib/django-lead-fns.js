
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { djangoLeadRequest } from "@/lib/django-proxy.server";

export const adminListLeads = createServerFn({ method: "GET" })
  .validator(
    z.object({
      status: z.enum(["all", "new", "in_progress", "done"]).default("all"),
    }),
  )
  .handler(async ({ data }) => {
    return djangoLeadRequest({
      data: {
        action: "list",
        status: data.status,
      },
    });
  });

export const adminUpdateLead = createServerFn({ method: "POST" })
  .validator(
    z.object({
      id: z.union([
        z.number().int().positive(),
        z.string().regex(/^[1-9]\d*$/),
      ]),
      patch: z.object({
        status: z.enum(["new", "in_progress", "done"]).optional(),
        internal_notes: z.string().max(2000).optional(),
      }).refine((patch) => Object.keys(patch).length > 0),
    }),
  )
  .handler(async ({ data }) => {
    return djangoLeadRequest({
      data: {
        action: "update",
        id: data.id,
        patch: data.patch,
      },
    });
  });
