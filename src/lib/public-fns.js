import { djangoPublicRequest } from "@/lib/django-proxy.server";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const optionalNumber = z.number().finite().optional();

const searchSchema = z.object({
  q: z.string().max(80).optional(),
  brand: z.string().max(60).optional(),
  body_type: z.string().max(40).optional(),
  fuel: z.string().max(30).optional(),
  transmission: z.string().max(30).optional(),
  category: z.string().max(40).optional(),
  year_min: optionalNumber,
  year_max: optionalNumber,
  price_min: optionalNumber,
  price_max: optionalNumber,
  mileage_max: optionalNumber,
  featured_only: z.boolean().optional(),
  sort: z.enum(["recent", "price_asc", "price_desc", "km_asc"]).optional(),
  limit: z.number().int().min(1).max(36).optional(),
  cursor: z.string().max(200).optional(),
});

const SORTS = {
  recent: "-created_date",
  price_asc: "price",
  price_desc: "-price",
  km_asc: "mileage",
};

export function buildVehicleQuery(input) {
  const query = { status: "available" };
  if (input.brand) query.brand = input.brand;
  if (input.body_type) query.body_type = input.body_type;
  if (input.fuel) query.fuel = input.fuel;
  if (input.transmission) query.transmission = input.transmission;
  if (input.category) query.category = input.category;
  if (input.featured_only) query.featured = true;

  if (input.q) {
    const rx = { $regex: input.q, $options: "i" };
    query.$or = [{ brand: rx }, { model: rx }, { version: rx }];
  }
  if (input.year_min != null || input.year_max != null) {
    query.year_model = {};
    if (input.year_min != null) query.year_model.$gte = input.year_min;
    if (input.year_max != null) query.year_model.$lte = input.year_max;
  }
  if (input.price_min != null || input.price_max != null) {
    query.price = {};
    if (input.price_min != null) query.price.$gte = input.price_min;
    if (input.price_max != null) query.price.$lte = input.price_max;
  }
  if (input.mileage_max != null) query.mileage = { $lte: input.mileage_max };
  return query;
}

export const searchVehicles = createServerFn({ method: "GET" })
  .validator(searchSchema)
  .handler(async ({ data }) => {
    return djangoPublicRequest("vehicles", data);
  });
export const getCatalogFacets = createServerFn({ method: "GET" })
  .handler(async () => {
    return djangoPublicRequest("facets");
  });
export const getHomeData = createServerFn({ method: "GET" })
  .handler(async () => {
    return djangoPublicRequest("home");
  });

export const getStore = createServerFn({ method: "GET" })
  .handler(async () => {
    return djangoPublicRequest("store");
  });

export const getVehicleDetail = createServerFn({ method: "GET" })
  .validator(z.object({ id: z.string().min(1).max(120) }))
  .handler(async ({ data }) => {
    return djangoPublicRequest("vehicleDetail", {
      id: data.id,
    });
  });const leadSchema = z.object({
  name: z.string().trim().min(2).max(120),
  phone: z.string().trim().min(10).max(20),
  email: z.string().trim().max(160).optional().or(z.literal("")),
  message: z.string().trim().max(1200).optional().or(z.literal("")),
  vehicle_id: z.string().max(120).optional().or(z.literal("")),
  vehicle_label: z.string().max(180).optional().or(z.literal("")),
  website: z.string().max(200).optional(),
});

export const createLead = createServerFn({ method: "POST" })
  .validator(leadSchema)
  .handler(async ({ data }) => {
    if (data.website) return { ok: true };

    const digits = String(data.phone).replace(/\D/g, "");

    if (digits.length < 10) {
      return {
        ok: false,
        error: "Informe um telefone válido com DDD.",
      };
    }

    return djangoPublicRequest("leads", {
      name: data.name,
      phone: data.phone,
      email: data.email || "",
      message: data.message || "",
      vehicle_id: data.vehicle_id || "",
      vehicle_label: data.vehicle_label || "",
      website: data.website || "",
    });
  });