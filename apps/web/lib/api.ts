// Helper dùng chung cho route handler trong app/api/**: response JSON, lỗi thống nhất, xác thực, kiểm Origin, đọc body có giới hạn.
// Lỗi luôn có dạng { ok: false, error, code } — giữ chuỗi `error` cũ vì Plan Builder (plan-page.js), indicator ATAS
// và các trang dashboard đang đọc trường này; `code` là mã máy đọc được, không dịch.
import { createHash, timingSafeEqual } from "node:crypto";
import type { z } from "zod";
import { getOwner, getViewer, type Owner, type Viewer } from "@/lib/auth";

export type ErrorCode =
  | "unauthorized"
  | "forbidden_origin"
  | "bad_request"
  | "invalid_body"
  | "payload_too_large"
  | "unsupported_type"
  | "not_found"
  | "method_not_allowed"
  | "config"
  | "upstream"
  | "internal";

export function json(body: unknown, status = 200, headers: Record<string, string> = {}) {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store", ...headers } });
}

export function fail(status: number, code: ErrorCode, error: string, extra: Record<string, unknown> = {}, headers: Record<string, string> = {}) {
  return json({ ...extra, ok: false, error, code }, status, headers);
}

export { errText } from "@/lib/db";

// ---------- xác thực ----------

// So sánh token thời gian hằng, không lộ độ dài (băm SHA-256 hai phía trước khi so).
export function tokenEquals(given: string, expected: string | undefined) {
  if (!expected || !given) return false;
  const h = (s: string) => createHash("sha256").update(s, "utf8").digest();
  return timingSafeEqual(h(given), h(expected));
}

export function bearer(req: Request) {
  return String(req.headers.get("authorization") || "")
    .replace(/^Bearer\s+/i, "")
    .trim();
}

export const unauthorized = () => fail(401, "unauthorized", "unauthorized");

// Chỉ chủ sở hữu (journal, plan, ảnh, members). Trả Owner hoặc Response 401.
export async function requireOwnerApi(): Promise<Owner | Response> {
  return (await getOwner()) ?? unauthorized();
}

// Chủ sở hữu hoặc khách đã duyệt (dữ liệu thị trường).
export async function requireViewerApi(): Promise<Viewer | Response> {
  return (await getViewer()) ?? unauthorized();
}

// Token Bearer cố định (ATAS gửi PLAN_TOKEN). true khi đúng.
export function requireToken(req: Request, expected: string | undefined) {
  return tokenEquals(bearer(req), expected);
}

// ---------- chống CSRF (lớp phụ, cookie Supabase đã SameSite=Lax) ----------
// Request ghi dữ liệu bằng phiên cookie: trình duyệt luôn gửi Origin với POST / PUT / PATCH / DELETE → phải cùng host.
// Không có Origin (curl, ATAS) thì cho qua: những client này không mang cookie phiên của người dùng.
export function crossOrigin(req: Request): Response | null {
  const origin = req.headers.get("origin");
  if (!origin) return null;
  try {
    const o = new URL(origin);
    const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || new URL(req.url).host;
    if (o.host === host) return null;
  } catch {
    /* Origin hỏng → chặn */
  }
  return fail(403, "forbidden_origin", "Origin không hợp lệ");
}

// ---------- body ----------

// Chặn sớm theo Content-Length (Vercel còn giới hạn ~4.5 MB ở tầng trước).
export function tooLarge(req: Request, maxBytes: number): Response | null {
  const n = Number(req.headers.get("content-length") || 0);
  return Number.isFinite(n) && n > maxBytes ? fail(413, "payload_too_large", "Body quá lớn") : null;
}

export type Parsed<T> = { ok: true; data: T } | { ok: false; response: Response };

// Đọc JSON (không phụ thuộc Content-Type, giống hành vi cũ của /api/plan) rồi kiểm bằng zod.
export async function readJson<S extends z.ZodType>(
  req: Request,
  schema: S,
  opts: { maxBytes: number; invalid: (issues: z.core.$ZodIssue[]) => string; notJson?: string },
): Promise<Parsed<z.infer<S>>> {
  const big = tooLarge(req, opts.maxBytes);
  if (big) return { ok: false, response: big };
  let raw: unknown;
  try {
    const text = await req.text();
    if (text.length > opts.maxBytes) return { ok: false, response: fail(413, "payload_too_large", "Body quá lớn") };
    raw = JSON.parse(text);
  } catch {
    raw = undefined;
  }
  if (raw === undefined && opts.notJson) return { ok: false, response: fail(400, "invalid_body", opts.notJson) };
  const r = schema.safeParse(raw);
  if (!r.success) return { ok: false, response: fail(400, "invalid_body", opts.invalid(r.error.issues), { issues: issuesOf(r.error.issues) }) };
  return { ok: true, data: r.data };
}

// Tối đa 5 lỗi, dạng "prth.vah: Expected number" để đọc nhanh trong log / response.
export function issuesOf(issues: z.core.$ZodIssue[]) {
  return issues.slice(0, 5).map((i) => `${i.path.join(".") || "(body)"}: ${i.message}`);
}

export const methodNotAllowed = (allow: string) => () => fail(405, "method_not_allowed", "method not allowed", {}, { Allow: allow });
