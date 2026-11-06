
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { djangoVehicleRequest } from "@/lib/django-proxy.server";

const vehiclePayload = z.object({
  brand: z.string().trim().min(1).max(60),
  model: z.string().trim().min(1).max(80),
  version: z.string().trim().max(120).optional().default(""),

  year_manufacture: z.number().int().min(1900).max(2100).optional().nullable(),
  year_model: z.number().int().min(1900).max(2100),

  price: z.number().min(0).max(100000000),
  mileage: z.number().int().min(0).max(3000000).optional().default(0),

  fuel: z.string().max(10).optional().default("Flex"),
  transmission: z.string().max(13).optional().default("Manual"),
  color: z.string().max(40).optional().default(""),

  category: z.string().max(10).optional().default("Seminovo"),
  body_type: z.string().max(12).optional().default("Hatch"),
  doors: z.number().int().min(0).max(10).optional().nullable(),

  engine: z.string().max(60).optional().default(""),
  power: z.string().max(60).optional().default(""),
  description: z.string().max(6000).optional().default(""),

  features: z.array(z.string().max(80)).max(80).optional().default([]),
  equipment: z.array(z.string().max(80)).max(80).optional().default([]),

  notes: z.string().max(2000).optional().default(""),
  status: z.enum(["available", "paused", "sold"]).optional().default("available"),
  featured: z.boolean().optional().default(false),

  images: z.array(z.string().max(500)).max(12).optional().default([]),
});

export const adminSaveVehicle = createServerFn({ method: "POST" })
  .validator(z.object({
    id: z.union([
      z.number().int().positive(),
      z.string().regex(/^[1-9]\d*$/),
    ]).optional(),
    data: vehiclePayload,
  }))
  .handler(async ({ data }) => {
    return djangoVehicleRequest({
      data: {
        action: "save",
        id: data.id,
        payload: data.data,
      },
    });
  });
