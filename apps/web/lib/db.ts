// Đọc ghi schema "trading" (và "access", xem lib/members.ts) qua PostgREST bằng secret key (chỉ server, sau khi đã kiểm quyền).
// Bảng trading.* bật RLS, không có policy: chỉ service_role (secret key) vào được.
import { secretKey, supabaseUrl } from "@/lib/env";
import { TRADING_BUCKET } from "@/lib/storage";


export class DbError extends Error {
  status: number;
  constructor(message: string, status = 0) {
    super(message);
    this.status = status;
  }
}

function cfg() {
  const url = supabaseUrl();
  const key = secretKey();
  if (!url || !key) throw new DbError("Thiếu SUPABASE_URL / secret key", 500);
  const h = { apikey: key, Authorization: "Bearer " + key };
  return { url, h };
}

export function dbReady() {
  return !!(supabaseUrl() && secretKey());
}

async function call<T>(schema: string, method: string, table: string, query: string, body?: unknown, prefer?: string): Promise<T> {
  const { url, h } = cfg();
  const headers: Record<string, string> = { ...h };
  if (method === "GET") headers["Accept-Profile"] = schema;
  else {
    headers["Content-Profile"] = schema;
    headers["Accept-Profile"] = schema;
    headers["Content-Type"] = "application/json";
  }
  if (prefer) headers.Prefer = prefer;
  const r = await fetch(`${url}/rest/v1/${table}${query ? "?" + query : ""}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: "no-store",
  });
  if (!r.ok) throw new DbError(`supabase ${r.status}: ${(await r.text()).slice(0, 300)}`, r.status);
  if (r.status === 204) return [] as T;
  const text = await r.text();
  return (text ? JSON.parse(text) : []) as T;
}

// Client cho một schema (phải nằm trong Exposed schemas của Data API).
export function dbSchema(schema: string) {
  return {
    select<T>(table: string, query: string) {
      return call<T[]>(schema, "GET", table, query);
    },
    upsert<T>(table: string, rows: unknown, onConflict: string) {
      return call<T[]>(schema, "POST", table, `on_conflict=${onConflict}`, rows, "resolution=merge-duplicates,return=representation");
    },
    insert<T>(table: string, rows: unknown) {
      return call<T[]>(schema, "POST", table, "", rows, "return=representation");
    },
    update<T>(table: string, query: string, patch: unknown) {
      return call<T[]>(schema, "PATCH", table, query, patch, "return=representation");
    },
    rpc<T>(fn: string, args: unknown) {
      return call<T>(schema, "POST", `rpc/${fn}`, "", args);
    },
    remove(table: string, query: string) {
      return call<unknown[]>(schema, "DELETE", table, query, undefined, "return=minimal");
    },
  };
}

export const db = dbSchema("trading");

// Link ký tạm để xem ảnh trong bucket private.
export async function signedUrl(path: string, expiresIn = 3600): Promise<string | null> {
  try {
    const { url, h } = cfg();
    const bucket = process.env.PLAN_BUCKET || TRADING_BUCKET;
    const r = await fetch(`${url}/storage/v1/object/sign/${bucket}/${path}`, {
      method: "POST",
      headers: { ...h, "Content-Type": "application/json" },
      body: JSON.stringify({ expiresIn }),
      cache: "no-store",
    });
    if (!r.ok) return null;
    const j = (await r.json()) as { signedURL?: string; signedUrl?: string };
    const u = j.signedURL || j.signedUrl;
    return u ? `${url}/storage/v1${u}` : null;
  } catch {
    return null;
  }
}

// Storage (bucket private "trading"), chỉ server gọi bằng secret key.
export const storage = {
  async put(path: string, body: Buffer | Uint8Array, contentType: string) {
    const { url, h } = cfg();
    const r = await fetch(`${url}/storage/v1/object/${TRADING_BUCKET}/${path}`, {
      method: "POST",
      headers: { ...h, "Content-Type": contentType, "x-upsert": "false", "Cache-Control": "max-age=31536000" },
      body: body as BodyInit,
      cache: "no-store",
    });
    if (!r.ok) throw new DbError(`storage ${r.status}: ${(await r.text()).slice(0, 200)}`, r.status);
  },
  async get(path: string) {
    const { url, h } = cfg();
    return fetch(`${url}/storage/v1/object/authenticated/${TRADING_BUCKET}/${path}`, { headers: h, cache: "no-store" });
  },
  async remove(paths: string[]) {
    const { url, h } = cfg();
    const r = await fetch(`${url}/storage/v1/object/${TRADING_BUCKET}`, {
      method: "DELETE",
      headers: { ...h, "Content-Type": "application/json" },
      body: JSON.stringify({ prefixes: paths }),
      cache: "no-store",
    });
    if (!r.ok) throw new DbError(`storage ${r.status}: ${(await r.text()).slice(0, 200)}`, r.status);
  },
};

export function errText(e: unknown) {
  return String((e as Error)?.message ?? e);
}
