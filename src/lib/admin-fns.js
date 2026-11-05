import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  PASSWORD_ITERATIONS,
  hashPassword,
  randomHex,
  signToken,
  verifyToken,
  safeEqual,
} from "@/lib/admin-auth.server";

const MAX_ATTEMPTS = 5;
const LOCK_MS = 60 * 1000;
const TOKEN_HOURS = 12;

async function getCredential(base44) {
  const list = await base44.asServiceRole.entities.AdminCredential.list({
    sort: "-updated_date",
    limit: 1,
  });
  return (list.items ?? [])[0] ?? null;
}

async function guard(context, token) {
  const base44 = context.getBase44();
  const credential = await getCredential(base44);
  if (!credential) return null;
  const valid = await verifyToken(token, credential.password_hash);
  return valid ? { base44, credential } : null;
}

const unauthorized = { ok: false, error: "unauthorized" };

export const adminStatus = createServerFn({ method: "POST" })
  .validator(z.object({ token: z.string().max(500).optional() }))
  .handler(async ({ data, context }) => {
    const base44 = context.getBase44();
    const credential = await getCredential(base44);
    if (!credential) return { configured: false, valid: false };
    const valid = data.token ? await verifyToken(data.token, credential.password_hash) : false;
    return { configured: true, valid };
  });

export const adminSetup = createServerFn({ method: "POST" })
  .validator(z.object({ password: z.string().min(8).max(200) }))
  .handler(async ({ data, context }) => {
    const base44 = context.getBase44();
    const existing = await getCredential(base44);
    if (existing) return { ok: false, error: "already_configured" };

    const salt = randomHex(16);
    const password_hash = await hashPassword(data.password, salt, PASSWORD_ITERATIONS);
    await base44.asServiceRole.entities.AdminCredential.create({
      password_hash,
      salt,
      iterations: PASSWORD_ITERATIONS,
      failed_attempts: 0,
      locked_until: "",
      password_updated_at: new Date().toISOString(),
    });
    return { ok: true, token: await signToken(password_hash, TOKEN_HOURS) };
  });

export const adminLogin = createServerFn({ method: "POST" })
  .validator(z.object({ password: z.string().min(1).max(200) }))
  .handler(async ({ data, context }) => {
    const base44 = context.getBase44();
    const credential = await getCredential(base44);
    if (!credential) return { ok: false, error: "not_configured" };

    if (credential.locked_until && new Date(credential.locked_until).getTime() > Date.now()) {
      const seconds = Math.ceil((new Date(credential.locked_until).getTime() - Date.now()) / 1000);
      return { ok: false, error: "locked", seconds };
    }

    const attempt = await hashPassword(
      data.password,
      credential.salt,
      credential.iterations || PASSWORD_ITERATIONS
    );

    if (!safeEqual(attempt, credential.password_hash)) {
      const failed = (credential.failed_attempts || 0) + 1;
      const locked = failed >= MAX_ATTEMPTS;
      await base44.asServiceRole.entities.AdminCredential.update(credential.id, {
        failed_attempts: locked ? 0 : failed,
        locked_until: locked ? new Date(Date.now() + LOCK_MS).toISOString() : "",
      });
      return {
        ok: false,
        error: locked ? "locked" : "invalid",
        seconds: locked ? Math.ceil(LOCK_MS / 1000) : 0,
        attempts_left: locked ? 0 : MAX_ATTEMPTS - failed,
      };
    }

    await base44.asServiceRole.entities.AdminCredential.update(credential.id, {
      failed_attempts: 0,
      locked_until: "",
    });
    return { ok: true, token: await signToken(credential.password_hash, TOKEN_HOURS) };
  });

export const adminChangePassword = createServerFn({ method: "POST" })
  .validator(
    z.object({
      token: z.string().max(500),
      password: z.string().min(8).max(200),
    })
  )
  .handler(async ({ data, context }) => {
    const session = await guard(context, data.token);
    if (!session) return unauthorized;

    const salt = randomHex(16);
    const password_hash = await hashPassword(data.password, salt, PASSWORD_ITERATIONS);
    await session.base44.asServiceRole.entities.AdminCredential.update(session.credential.id, {
      password_hash,
      salt,
      iterations: PASSWORD_ITERATIONS,
      password_updated_at: new Date().toISOString(),
      failed_attempts: 0,
      locked_until: "",
    });
    return { ok: true, token: await signToken(password_hash, TOKEN_HOURS) };
  });

export const adminDashboard = createServerFn({ method: "POST" })
  .validator(z.object({ token: z.string().max(500) }))
  .handler(async ({ data, context }) => {
    const session = await guard(context, data.token);
    if (!session) return unauthorized;
    const svc = session.base44.asServiceRole;

    const [total, available, sold, paused, featured, leadsTotal, leadsNew, byBrand, recentLeads] =
      await Promise.all([
        svc.entities.Vehicle.count({}),
        svc.entities.Vehicle.count({ status: "available" }),
        svc.entities.Vehicle.count({ status: "sold" }),
        svc.entities.Vehicle.count({ status: "paused" }),
        svc.entities.Vehicle.count({ featured: true }),
        svc.entities.Lead.count({}),
        svc.entities.Lead.count({ status: "new" }),
        svc.entities.Vehicle.aggregate({ query: {}, groupBy: "brand" }),
        svc.entities.Lead.list({ sort: "-created_date", limit: 6 }),
      ]);

    const leadsByStatus = await svc.entities.Lead.aggregate({ query: {}, groupBy: "status" });

    return {
      ok: true,
      counts: { total, available, sold, paused, featured, leadsTotal, leadsNew },
      brands: (byBrand.rows ?? [])
        .map((row) => ({ brand: row.brand || "—", count: row.count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 6),
      leads: leadsByStatus.rows ?? [],
      recentLeads: recentLeads.items ?? [],
    };
  });

export const adminListVehicles = createServerFn({ method: "POST" })
  .validator(
    z.object({
      token: z.string().max(500),
      q: z.string().max(80).optional(),
      status: z.enum(["all", "available", "paused", "sold"]).optional(),
      cursor: z.string().max(200).optional(),
    })
  )
  .handler(async ({ data, context }) => {
    const session = await guard(context, data.token);
    if (!session) return unauthorized;
    const svc = session.base44.asServiceRole;

    const query = {};
    if (data.status && data.status !== "all") query.status = data.status;
    if (data.q) {
      const rx = { $regex: data.q, $options: "i" };
      query.$or = [{ brand: rx }, { model: rx }, { version: rx }];
    }

    const options = { sort: "-created_date", limit: 24 };
    if (data.cursor) options.cursor = data.cursor;

    const page = await svc.entities.Vehicle.filter(query, options);
    const total = await svc.entities.Vehicle.count(query);
    return {
      ok: true,
      items: page.items ?? [],
      total,
      has_more: Boolean(page.has_more),
      next_cursor: page.next_cursor ?? null,
    };
  });

export const adminGetVehicle = createServerFn({ method: "POST" })
  .validator(z.object({ token: z.string().max(500), id: z.string().max(120) }))
  .handler(async ({ data, context }) => {
    const session = await guard(context, data.token);
    if (!session) return unauthorized;
    const vehicle = await session.base44.asServiceRole.entities.Vehicle.get(data.id).catch(() => null);
    return { ok: true, vehicle };
  });

const vehiclePayload = z.object({
  brand: z.string().trim().min(1).max(60),
  model: z.string().trim().min(1).max(80),
  version: z.string().trim().max(120).optional().default(""),
  year_manufacture: z.number().int().min(1900).max(2100).optional().nullable(),
  year_model: z.number().int().min(1900).max(2100),
  price: z.number().min(0).max(100000000),
  mileage: z.number().min(0).max(3000000).optional().default(0),
  fuel: z.string().max(30).optional().default("Flex"),
  transmission: z.string().max(30).optional().default("Manual"),
  color: z.string().max(40).optional().default(""),
  category: z.string().max(40).optional().default("Seminovo"),
  body_type: z.string().max(40).optional().default("Hatch"),
  doors: z.number().int().min(0).max(10).optional().nullable(),
  engine: z.string().max(60).optional().default(""),
  power: z.string().max(60).optional().default(""),
  description: z.string().max(6000).optional().default(""),
  features: z.array(z.string().max(80)).max(80).optional().default([]),
  equipment: z.array(z.string().max(80)).max(80).optional().default([]),
  notes: z.string().max(2000).optional().default(""),
  status: z.enum(["available", "paused", "sold"]).optional().default("available"),
  featured: z.boolean().optional().default(false),
  images: z.array(z.string().max(500)).max(20).optional().default([]),
});

export const adminSaveVehicle = createServerFn({ method: "POST" })
  .validator(z.object({ token: z.string().max(500), id: z.string().max(120).optional(), data: vehiclePayload }))
  .handler(async ({ data, context }) => {
    const session = await guard(context, data.token);
    if (!session) return unauthorized;
    const svc = session.base44.asServiceRole;

    if (data.id) {
      const vehicle = await svc.entities.Vehicle.update(data.id, data.data);
      return { ok: true, vehicle };
    }
    const vehicle = await svc.entities.Vehicle.create({ ...data.data, is_demo: false });
    return { ok: true, vehicle };
  });

export const adminDeleteVehicle = createServerFn({ method: "POST" })
  .validator(z.object({ token: z.string().max(500), id: z.string().max(120) }))
  .handler(async ({ data, context }) => {
    const session = await guard(context, data.token);
    if (!session) return unauthorized;
    await session.base44.asServiceRole.entities.Vehicle.delete(data.id);
    return { ok: true };
  });

export const adminQuickUpdate = createServerFn({ method: "POST" })
  .validator(
    z.object({
      token: z.string().max(500),
      id: z.string().max(120),
      patch: z.object({
        status: z.enum(["available", "paused", "sold"]).optional(),
        featured: z.boolean().optional(),
        price: z.number().min(0).max(100000000).optional(),
      }),
    })
  )
  .handler(async ({ data, context }) => {
    const session = await guard(context, data.token);
    if (!session) return unauthorized;
    const vehicle = await session.base44.asServiceRole.entities.Vehicle.update(data.id, data.patch);
    return { ok: true, vehicle };
  });

export const adminListLeads = createServerFn({ method: "POST" })
  .validator(
    z.object({
      token: z.string().max(500),
      status: z.enum(["all", "new", "in_progress", "done"]).optional(),
    })
  )
  .handler(async ({ data, context }) => {
    const session = await guard(context, data.token);
    if (!session) return unauthorized;
    const svc = session.base44.asServiceRole;
    const query = data.status && data.status !== "all" ? { status: data.status } : {};
    const page = await svc.entities.Lead.filter(query, { sort: "-created_date", limit: 60 });
    const counts = await svc.entities.Lead.aggregate({ query: {}, groupBy: "status" });
    return {
      ok: true,
      items: page.items ?? [],
      counts: counts.rows ?? [],
    };
  });

export const adminUpdateLead = createServerFn({ method: "POST" })
  .validator(
    z.object({
      token: z.string().max(500),
      id: z.string().max(120),
      patch: z.object({
        status: z.enum(["new", "in_progress", "done"]).optional(),
        internal_notes: z.string().max(2000).optional(),
      }),
    })
  )
  .handler(async ({ data, context }) => {
    const session = await guard(context, data.token);
    if (!session) return unauthorized;
    const lead = await session.base44.asServiceRole.entities.Lead.update(data.id, data.patch);
    return { ok: true, lead };
  });

const settingsPayload = z.object({
  name: z.string().trim().min(1).max(120),
  tagline: z.string().max(120).optional().default(""),
  logo_url: z.string().max(500).optional().default(""),
  hero_image: z.string().max(500).optional().default(""),
  store_image: z.string().max(500).optional().default(""),
  whatsapp: z.string().max(30).optional().default(""),
  phone: z.string().max(30).optional().default(""),
  address: z.string().max(200).optional().default(""),
  city: z.string().max(80).optional().default(""),
  state: z.string().max(2).optional().default(""),
  opening_hours: z.string().max(300).optional().default(""),
  instagram: z.string().max(200).optional().default(""),
  facebook: z.string().max(300).optional().default(""),
  about_text: z.string().max(2000).optional().default(""),
});

export const adminGetSettings = createServerFn({ method: "POST" })
  .validator(z.object({ token: z.string().max(500) }))
  .handler(async ({ data, context }) => {
    const session = await guard(context, data.token);
    if (!session) return unauthorized;
    const list = await session.base44.asServiceRole.entities.StoreSettings.list({
      sort: "-updated_date",
      limit: 1,
    });
    return { ok: true, settings: (list.items ?? [])[0] ?? null };
  });

export const adminSaveSettings = createServerFn({ method: "POST" })
  .validator(z.object({ token: z.string().max(500), data: settingsPayload }))
  .handler(async ({ data, context }) => {
    const session = await guard(context, data.token);
    if (!session) return unauthorized;
    const svc = session.base44.asServiceRole;
    const list = await svc.entities.StoreSettings.list({ sort: "-updated_date", limit: 1 });
    const current = (list.items ?? [])[0];
    const settings = current
      ? await svc.entities.StoreSettings.update(current.id, data.data)
      : await svc.entities.StoreSettings.create(data.data);
    return { ok: true, settings };
  });

export const adminUploadImage = createServerFn({ method: "POST" })
  .validator(
    z.object({
      token: z.string().max(500),
      filename: z.string().min(1).max(120),
      contentType: z.enum(["image/jpeg", "image/png", "image/webp"]),
      dataBase64: z.string().min(100).max(9000000),
    })
  )
  .handler(async ({ data, context }) => {
    const session = await guard(context, data.token);
    if (!session) return unauthorized;

    const binary = atob(data.dataBase64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);

    const file = new File([bytes], data.filename, { type: data.contentType });
    const uploaded = await session.base44.asServiceRole.integrations.Core.UploadPublicFile({ file });
    return { ok: true, url: uploaded.file_url };
  });