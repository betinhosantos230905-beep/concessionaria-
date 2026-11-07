
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { djangoSettingsRequest } from "@/lib/django-proxy.server";

const settingsSchema = z.object({
  name: z.string().trim().min(1).max(120),
  tagline: z.string().max(120),
  logo_url: z.string().max(500),
  hero_image: z.string().max(500),
  store_image: z.string().max(500),
  whatsapp: z.string().max(30),
  phone: z.string().max(30),
  address: z.string().max(200),
  city: z.string().max(80),
  state: z.string().max(2),
  opening_hours: z.string().max(300),
  instagram: z.string().max(200),
  facebook: z.string().max(300),
  about_text: z.string().max(10000),
});

export const adminSaveSettings = createServerFn({ method: "POST" })
  .validator(settingsSchema)
  .handler(async ({ data }) => {
    return djangoSettingsRequest({
      data: {
        action: "save",
        payload: data,
      },
    });
  });
