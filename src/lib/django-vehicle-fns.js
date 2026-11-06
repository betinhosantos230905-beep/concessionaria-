
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { djangoVehicleRequest } from "@/lib/django-proxy.server";

const vehicleId = z.union([
  z.number().int().positive(),
  z.string().regex(/^[1-9]\d*$/),
]);

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

// Cadastrar ou editar veículo
export const adminSaveVehicle = createServerFn({ method: "POST" })
  .validator(z.object({
    id: vehicleId.optional(),
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

// Listar veículos do painel
export const adminListVehicles = createServerFn({ method: "GET" })
  .validator(z.object({
    q: z.string().max(80).optional(),
    status: z.enum(["all", "available", "paused", "sold"]).optional(),
    limit: z.number().int().min(1).max(36).optional(),
    offset: z.number().int().min(0).max(100000).optional(),
  }))
  .handler(async ({ data }) => {
    return djangoVehicleRequest({
      data: {
        action: "list",
        ...data,
      },
    });
  });

// Consultar veículo individual
export const adminGetVehicle = createServerFn({ method: "GET" })
  .validator(z.object({
    id: vehicleId,
  }))
  .handler(async ({ data }) => {
    return djangoVehicleRequest({
      data: {
        action: "get",
        id: data.id,
      },
    });
  });

// Atualização rápida de preço, situação ou destaque
export const adminQuickUpdate = createServerFn({ method: "POST" })
  .validator(z.object({
    id: vehicleId,
    patch: z.object({
      status: z.enum(["available", "paused", "sold"]).optional(),
      featured: z.boolean().optional(),
      price: z.number().min(0).max(100000000).optional(),
    }).refine((patch) => Object.keys(patch).length > 0),
  }))
  .handler(async ({ data }) => {
    return djangoVehicleRequest({
      data: {
        action: "quickUpdate",
        id: data.id,
        patch: data.patch,
      },
    });
  });

// Excluir veículo
export const adminDeleteVehicle = createServerFn({ method: "POST" })
  .validator(z.object({
    id: vehicleId,
  }))
  .handler(async ({ data }) => {
    return djangoVehicleRequest({
      data: {
        action: "delete",
        id: data.id,
      },
    });
  });

// Carregar dados da Visão geral administrativa
export const adminDashboard = createServerFn({ method: "GET" })
  .validator(z.object({}))
  .handler(async () => {
    return djangoVehicleRequest({
      data: {
        action: "dashboard",
      },
    });
  });


// Enviar imagens para o Cloudinary através do Django
export const adminUploadImage = createServerFn({ method: "POST" })
  .validator(
    z.object({
      filename: z.string().min(1).max(120),
      contentType: z.enum([
        "image/jpeg",
        "image/png",
        "image/webp",
      ]),
      dataBase64: z.string().min(100).max(21_000_000),
      folder: z.enum(["vehicles", "store"]),
    }),
  )
  .handler(async ({ data }) => {
    return djangoVehicleRequest({
      data: {
        action: "uploadImage",
        filename: data.filename,
        contentType: data.contentType,
        dataBase64: data.dataBase64,
        folder: data.folder,
      },
    });
  });

