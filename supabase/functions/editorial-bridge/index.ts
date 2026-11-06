import { createClient } from "https://esm.sh/@supabase/supabase-js@2.118.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const REDACTOR_EMAIL = Deno.env.get("REDACTOR_EMAIL") ?? "";
const REDACTOR_PASSWORD = Deno.env.get("REDACTOR_PASSWORD") ?? "";
const BRIDGE_TOKEN = Deno.env.get("EDITORIAL_BRIDGE_TOKEN") ?? "";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type, apikey",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Content-Type": "application/json; charset=utf-8",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: cors });
}

function fail(message: string, status = 400) {
  return json({ error: message }, status);
}

function authorized(req: Request) {
  if (!BRIDGE_TOKEN) return false;
  const value = req.headers.get("authorization") ?? "";
  return value === `Bearer ${BRIDGE_TOKEN}`;
}

function textField(value: unknown, name: string, min = 1, max = 5000) {
  if (typeof value !== "string" || value.trim().length < min || value.trim().length > max) {
    throw new Error(`${name} debe tener entre ${min} y ${max} caracteres.`);
  }
  return value.trim();
}

function optionalText(value: unknown, max = 5000) {
  if (value == null || value === "") return "";
  return textField(value, "El texto", 1, max);
}

async function client() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !REDACTOR_EMAIL || !REDACTOR_PASSWORD) {
    throw new Error("La integración editorial no está configurada.");
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { error } = await supabase.auth.signInWithPassword({
    email: REDACTOR_EMAIL,
    password: REDACTOR_PASSWORD,
  });
  if (error) throw new Error("No se pudo autenticar la cuenta editorial.");

  return supabase;
}

async function handle(req: Request) {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (!authorized(req)) return fail("No autorizado.", 401);

  const url = new URL(req.url);
  const path = url.pathname.replace(/^\/functions\/v1\/editorial-bridge/, "").replace(/\/$/, "") || "/";

  if (req.method === "GET" && path === "/health") {
    return json({ ok: true, service: "editorial-bridge" });
  }

  const supabase = await client();

  if (req.method === "GET" && path === "/guias") {
    const { data, error } = await supabase.rpc("editorial_existing_guides");
    if (error) throw error;
    return json({ data });
  }

  if (req.method === "GET" && path === "/guia") {
    const slug = textField(url.searchParams.get("slug"), "slug", 3, 80);
    const { data, error } = await supabase.rpc("editorial_guide_content", { p_slug: slug });
    if (error) throw error;
    if (!data?.length) return fail("No existe la guía solicitada.", 404);
    return json({ data: data[0] });
  }

  if (req.method === "GET" && path === "/sugerencias") {
    const estado = url.searchParams.get("estado");
    const estadosValidos = ["nueva", "pedida", "redactada", "descartada", "existente"];
    if (estado && !estadosValidos.includes(estado)) return fail("Estado no válido.");

    let query = supabase
      .from("guide_suggestions")
      .select("id, kind, status, priority, title, reason, demand, topic, keywords, sources, instructions, created_at, requested_at, drafted_at, target:legal_resources!guide_suggestions_target_resource_id_fkey(slug, title)")
      .order("created_at", { ascending: false });

    if (estado) query = query.eq("status", estado);

    const { data, error } = await query;
    if (error) throw error;
    return json({ data });
  }

  if (req.method === "GET" && path === "/busquedas") {
    const rawDays = Number(url.searchParams.get("dias") ?? "30");
    if (!Number.isFinite(rawDays)) return fail("El parámetro dias debe ser un número.");
    const days = Math.min(Math.max(Math.trunc(rawDays), 1), 180);
    const { data, error } = await supabase.rpc("editorial_search_gaps", {
      p_days: days,
      p_max_results: 0,
    });
    if (error) throw error;
    return json({ data });
  }

  if (req.method !== "POST") return fail("Método no permitido.", 405);

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object" || Array.isArray(body)) return fail("JSON inválido.");

  if (path === "/sugerencia") {
    const kind = body.kind === "actualizar" ? "actualizar" : "nueva";
    const title = textField(body.title, "title", 5, 160);
    const reason = textField(body.reason, "reason", 20, 2000);
    const demand = optionalText(body.demand, 1000);
    const priority = ["alta", "media", "baja"].includes(body.priority) ? body.priority : "media";
    const topic = optionalText(body.topic, 40);
    if (body.keywords != null && (!Array.isArray(body.keywords) || body.keywords.length > 15)) {
      return fail("keywords debe ser una lista de máximo 15 elementos.");
    }
    if (body.sources != null && (!Array.isArray(body.sources) || body.sources.length > 15)) {
      return fail("sources debe ser una lista de máximo 15 elementos.");
    }
    const keywords = (body.keywords ?? []).map((x: unknown) => textField(x, "keyword", 1, 80));
    const sources = body.sources ?? [];
    const target = body.target == null ? null : textField(body.target, "target", 3, 80);

    const { data, error } = await supabase.rpc("editorial_add_suggestion", {
      p_kind: kind,
      p_title: title,
      p_reason: reason,
      p_demand: demand,
      p_priority: priority,
      p_topic: topic,
      p_keywords: keywords,
      p_sources: sources,
      p_target_slug: target,
    });
    if (error) throw error;
    return json({ id: data }, 201);
  }

  if (path === "/borrador") {
    const id = textField(body.id, "id", 36, 36);
    const slug = textField(body.slug, "slug", 3, 80);
    const title = textField(body.title, "title", 5, 160);
    const summary = textField(body.summary, "summary", 20, 400);
    const content = textField(body.content, "content", 50, 50000);
    const category = body.category == null ? null : optionalText(body.category, 80);
    const topic = body.topic == null ? null : optionalText(body.topic, 40);
    if (body.sources != null && !Array.isArray(body.sources)) return fail("sources debe ser una lista.");
    const sources = body.sources ?? [];

    const { data, error } = await supabase.rpc("editorial_save_draft", {
      p_id: id,
      p_slug: slug,
      p_title: title,
      p_summary: summary,
      p_content: content,
      p_category_slug: category,
      p_sources: sources,
      p_topic: topic,
    });
    if (error) throw error;
    return json({ id: data, status: "borrador" }, 201);
  }

  if (path === "/propuesta") {
    const id = textField(body.id, "id", 36, 36);
    const content = textField(body.content, "content", 50, 50000);
    const notes = optionalText(body.notes, 2000);

    const { error } = await supabase.rpc("editorial_save_proposal", {
      p_id: id,
      p_content: content,
      p_notes: notes,
    });
    if (error) throw error;
    return json({ status: "redactada" }, 201);
  }

  return fail("Operación no disponible.", 404);
}

Deno.serve(async (req) => {
  try {
    return await handle(req);
  } catch (error) {
    console.error(error instanceof Error ? error.message : "editorial bridge error");
    return fail("No se pudo completar la operación editorial.", 500);
  }
});
