// POST /api/plan   Header: Authorization: Bearer <PLAN_TOKEN>   Body: JSON v1 từ indicator "Deren · Plan Sender"
//   0. Cùng ngày + symbol + cùng số liệu (bỏ qua trigger / ts_et) trong 120 giây → không gửi Discord lần 2
//   1. Lưu (upsert theo ngày + symbol) vào bảng trading.trade_plans trên Supabase (schema riêng, không dùng public)
//   2. Lập plan bằng plan-core.js (cùng code với trang Trade Plan), vẽ ảnh tiếng Việt, PNG rồi nén WebP lossless (lib/image.ts)
//   3. Lưu ảnh WebP vào Supabase Storage (bucket private "trading", YYYY/MM/DD/plan/...), ghi đường dẫn + plan chữ vào bảng
//   4. Gửi ảnh + tóm tắt plan (kèm warnings của indicator) lên Discord (nếu có DISCORD_WEBHOOK_TRADE_PLAN và payload không có "notify": false)
//   Bước 2–4 lỗi thì plan vẫn được lưu; kết quả từng bước nằm trong response.
//   Bước 1 (database) lỗi thì vẫn vẽ ảnh, lưu Storage và gửi Discord để plan 9:29 không mất; response 502 kèm kết quả các bước.
//
// GET  /api/plan[?date=YYYY-MM-DD]   Header: Authorization: Bearer <PLAN_TOKEN>
//   → plan của ngày đó (hoặc mới nhất) + image_url (link ký tạm 1 giờ) nếu đã có ảnh
// GET  /api/plan?month=YYYY-MM        → { month, plans: [{ trade_date, symbol, summary, image_path, updated_at }] } (lịch sử Plan Studio)
//
// Xác thực: token PLAN_TOKEN (ATAS, trang Plan Builder cũ) HOẶC phiên đăng nhập Discord của chủ sở hữu (dashboard).
//
// Biến môi trường trên Vercel:
//   SUPABASE_URL, SUPABASE_SERVICE_KEY (hoặc SUPABASE_SECRET_KEY / SUPABASE_SERVICE_ROLE_KEY), PLAN_TOKEN,
//   DISCORD_WEBHOOK_TRADE_PLAN (tuỳ chọn; tên cũ DISCORD_WEBHOOK_URL vẫn nhận), PLAN_BUCKET (tuỳ chọn, mặc định "trading")
//   Schema "trading" phải nằm trong Exposed schemas (Supabase → Project Settings → Data API).
// Hợp đồng request / response giữ y như api/plan.js cũ (indicator ATAS đã code theo đó).

import path from "path";
import { Resvg } from "@resvg/resvg-js";
import core, { type Plan } from "@/lib/plan-core";
import { TRADING_BUCKET, planImagePath } from "@/lib/storage";
import { IMAGE_EXT, IMAGE_MIME, optimizeImage } from "@/lib/image";
import { getOwner } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

const SCHEMA = "trading";
const TABLE = "trade_plans";
const FONT_DIR = path.join(process.cwd(), "fonts");
const FONT_FILES = ["BeVietnamPro-Regular.ttf", "BeVietnamPro-Bold.ttf", "JetBrainsMono-Regular.ttf", "JetBrainsMono-Bold.ttf"]
  .map(f => path.join(FONT_DIR, f));
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const MONTH_RE = /^\d{4}-\d{2}$/;
const DUP_WINDOW_S = 120;

type Json = Record<string, unknown>;
type Payload = Json & { date?: string; symbol?: string; prth?: unknown; ovn?: unknown; notify?: boolean };

function json(body: unknown, status = 200, extra: Record<string, string> = {}) {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store", ...extra } });
}

// Log từng bước cho Vercel Runtime Logs (không ghi token, key, webhook).
function log(level: "info" | "warn" | "error", msg: string, data: Record<string, unknown> = {}) {
  console[level](`[api/plan] ${msg}`, JSON.stringify(data));
}

function errMsg(e: unknown) {
  return String((e as Error)?.message ?? e);
}

function supaHeaders(key: string): Record<string, string> {
  // Gửi key ở cả apikey lẫn Authorization như supabase-js. Với key mới "sb_secret_...", cổng API của Supabase
  // thay "Bearer sb_..." bằng JWT service_role nội bộ trước khi tới PostgREST / Storage; key JWT cũ thì dùng thẳng.
  return { apikey: key, Authorization: "Bearer " + key };
}

function safeEqual(a: string, b: string | undefined) {
  if (typeof b !== "string" || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

// So sánh payload không phụ thuộc thứ tự key (jsonb trong Postgres tự sắp lại key).
function stable(v: unknown): string {
  if (Array.isArray(v)) return "[" + v.map(stable).join(",") + "]";
  if (v && typeof v === "object") {
    return "{" + Object.keys(v as Json).sort().map(k => JSON.stringify(k) + ":" + stable((v as Json)[k])).join(",") + "}";
  }
  return JSON.stringify(v);
}

// Bỏ các trường đổi theo lần bấm (trigger, ts_et) để nhận ra 2 lần gửi cùng một plan.
function planKey(p: Json) {
  const { trigger: _t, ts_et: _ts, ...rest } = p;
  return stable(rest);
}

// Bỏ dấu "?" do indicator thay ký tự không phải ASCII; giữ tối đa 3 cảnh báo, mỗi cái 200 ký tự.
function warningsOf(p: Json): string[] {
  const w = Array.isArray(p.warnings) ? p.warnings : [];
  return w.filter(x => typeof x === "string" && x.trim()).slice(0, 3).map(x => (x as string).slice(0, 200));
}

function svgToPng(svg: string) {
  const r = new Resvg(svg, {
    fitTo: { mode: "zoom", value: 2 },
    font: { fontFiles: FONT_FILES, loadSystemFonts: false, defaultFontFamily: "Be Vietnam Pro" },
  });
  return Buffer.from(r.render().asPng());
}

async function sendDiscord(webhook: string, plan: Plan, img: Buffer, fileName: string, symbol: string, warnings: string[] = []) {
  const s = plan.summary;
  const color = s.bias === "Lên" ? 0x3fbf7f : s.bias === "Xuống" ? 0xef5350 : 0x9aa0a8;
  const lines = [
    `**Bias:** ${s.bias} · ${s.conf}`,
    `**Vị trí:** ${s.location}${s.zone ? ` (HVN ${core.fmt(s.zone.lo)}–${core.fmt(s.zone.hi)})` : ""}`,
    `**Setup:** ${s.setup}`,
    `**Target:** ${s.target != null ? `${core.fmt(s.target)} (cách giá 9:29 ${core.fmt(s.distance)} điểm)` : "theo mô tả setup"}`,
    `**Đổi bias:** ${s.flip}`,
    `**Giá 9:29:** ${core.fmt(s.price)} · Prev RTH ${core.lc1(s.prth)} · OVN ${core.lc1(s.ovn)}`,
    ...warnings.map(w => `⚠️ **Cảnh báo indicator:** ${w}`),
  ];
  const payload = {
    username: "Trade Plan",
    embeds: [{
      title: `PLAN ${s.date} · ${symbol}`,
      description: lines.join("\n").slice(0, 4000),
      color,
      image: { url: `attachment://${fileName}` },
      footer: { text: "Composite × pRTH × OVN · TPO 30' đổi bias, vào lệnh trên M1" },
    }],
    allowed_mentions: { parse: [] },
  };
  const fd = new FormData();
  fd.append("payload_json", JSON.stringify(payload));
  fd.append("files[0]", new Blob([new Uint8Array(img)], { type: IMAGE_MIME }), fileName);
  const r = await fetch(webhook, { method: "POST", body: fd });
  if (!r.ok) throw new Error(`discord ${r.status}: ${(await r.text()).slice(0, 200)}`);
  return { sent: true };
}

// Kiểm biến môi trường + token (hoặc phiên chủ sở hữu). Trả Response lỗi, hoặc cấu hình để gọi Supabase.
async function setup(req: Request) {
  const env = process.env;
  // Nhận cả tên biến do tích hợp Supabase ↔ Vercel tự tạo (SUPABASE_SECRET_KEY / SUPABASE_SERVICE_ROLE_KEY).
  const url = (env.SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/\/$/, "");
  const key = env.SUPABASE_SERVICE_KEY || env.SUPABASE_SECRET_KEY || env.SUPABASE_SERVICE_ROLE_KEY;
  const planToken = env.PLAN_TOKEN;
  if (!url || !key) {
    log("error", "thiếu biến môi trường", { url: !!url, key: !!key, planToken: !!planToken, env: process.env.VERCEL_ENV });
    return { error: json({ error: "Thiếu biến môi trường SUPABASE_URL / SUPABASE_SERVICE_KEY / PLAN_TOKEN" }, 500) };
  }
  const token = String(req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "").trim();
  const tokenOk = !!planToken && safeEqual(token, planToken);
  // Không có token thì thử phiên đăng nhập dashboard (cookie). Có token mà sai thì từ chối luôn.
  const via = tokenOk ? "token" : !token && (await getOwner()) ? "session" : null;
  if (!via) {
    if (!planToken) {
      log("error", "thiếu PLAN_TOKEN và không có phiên đăng nhập", { method: req.method });
      return { error: json({ error: "Thiếu biến môi trường SUPABASE_URL / SUPABASE_SERVICE_KEY / PLAN_TOKEN" }, 500) };
    }
    log("warn", "401 token sai", { method: req.method, hasToken: !!token, tokenLen: token.length });
    return { error: json({ error: "unauthorized" }, 401) };
  }

  const h = supaHeaders(key);
  const hj = { ...h, "Content-Type": "application/json" };
  return {
    via,
    rest: `${url}/rest/v1/${TABLE}`,
    storage: `${url}/storage/v1`,
    bucket: env.PLAN_BUCKET || TRADING_BUCKET,
    hook: env.DISCORD_WEBHOOK_TRADE_PLAN || env.DISCORD_WEBHOOK_URL,
    h,
    hj,
    // PostgREST chọn schema qua header: Accept-Profile (đọc), Content-Profile (ghi). Storage không cần.
    hr: { ...h, "Accept-Profile": SCHEMA },
    hw: { ...hj, "Content-Profile": SCHEMA },
  };
}

export async function POST(req: Request) {
  const c = await setup(req);
  if ("error" in c) return c.error;
  try {
    let p: Payload | null = null;
    try { p = JSON.parse(await req.text()); } catch { p = null; }
    if (!p || typeof p !== "object" || !DATE_RE.test(p.date || "") || !p.prth || !p.ovn) {
      log("warn", "400 payload thiếu trường", { date: p && p.date, prth: !!(p && p.prth), ovn: !!(p && p.ovn) });
      return json({ error: "Payload thiếu date (yyyy-MM-dd), prth hoặc ovn" }, 400);
    }
    const date = p.date as string;
    const symbol = String(p.symbol || "NQ").slice(0, 20);
    const warnings = warningsOf(p);
    // 0. Chống gửi trùng: cùng ngày + symbol, cùng số liệu (bỏ qua trigger / ts_et), lần trước < DUP_WINDOW_S giây
    //    → vẫn lưu + vẽ ảnh như thường nhưng không gửi Discord lần nữa (19/11: bấm tay + tự gửi 9:29 ra 2 tin).
    let duplicate = false;
    try {
      const r = await fetch(
        `${c.rest}?select=updated_at,payload&trade_date=eq.${date}&symbol=eq.${encodeURIComponent(symbol)}&limit=1`,
        { headers: c.hr, cache: "no-store" },
      );
      if (r.ok) {
        const prev = ((await r.json()) as Json[])[0];
        const age = prev ? (Date.now() - Date.parse(String(prev.updated_at))) / 1000 : Infinity;
        duplicate = !!prev && age >= 0 && age < DUP_WINDOW_S && planKey(prev.payload as Json) === planKey(p);
      }
    } catch { /* không đọc được thì coi như không trùng */ }
    // 1. Lưu payload. Lỗi ở đây không dừng hẳn: vẫn vẽ ảnh + gửi Discord, cuối cùng trả 502.
    let dbError: Json | null = null;
    try {
      const r = await fetch(`${c.rest}?on_conflict=trade_date,symbol`, {
        method: "POST",
        headers: { ...c.hw, Prefer: "resolution=merge-duplicates,return=minimal" },
        body: JSON.stringify({ trade_date: date, symbol, payload: p }),
      });
      if (!r.ok) dbError = { error: "supabase", status: r.status, detail: (await r.text()).slice(0, 300) };
    } catch (e) {
      dbError = { error: "supabase", status: 0, detail: errMsg(e).slice(0, 300) };
    }

    const out: Json = { ok: !dbError, date, symbol, image: null, discord: null, ...(warnings.length ? { warnings } : {}) };
    let plan: Plan | null = null, img: Buffer | null = null, objPath: string | null = null;

    // 2–3. Lập plan, vẽ ảnh, lưu Storage
    try {
      plan = core.planFromJson(p);
      if (plan.error) throw new Error(plan.error);
      img = await optimizeImage(svgToPng(plan.svg), "plan");
      objPath = planImagePath(date, symbol, IMAGE_EXT);
      const up = await fetch(`${c.storage}/object/${c.bucket}/${objPath}`, {
        method: "POST",
        headers: { ...c.h, "Content-Type": IMAGE_MIME, "x-upsert": "true", "cache-control": "no-cache" },
        body: new Uint8Array(img),
      });
      if (!up.ok) throw new Error(`storage ${up.status}: ${(await up.text()).slice(0, 200)}`);
      out.image = { path: objPath, bytes: img.length };
      if (dbError) throw new Error("database lỗi ở bước 1 nên chưa ghi đường dẫn ảnh vào bảng");
      const upd = await fetch(`${c.rest}?trade_date=eq.${date}&symbol=eq.${encodeURIComponent(symbol)}`, {
        method: "PATCH",
        headers: { ...c.hw, Prefer: "return=minimal" },
        body: JSON.stringify({ image_path: objPath, plan_text: plan.text, summary: plan.summary }),
      });
      if (!upd.ok) throw new Error(`update ${upd.status}: ${(await upd.text()).slice(0, 200)}`);
    } catch (e) {
      out.image = { ...((out.image as Json) || {}), error: errMsg(e) };
    }

    // 4. Discord
    if (c.hook && p.notify !== false && duplicate) {
      out.discord = { sent: false, skipped: "duplicate" };
    } else if (c.hook && p.notify !== false) {
      try {
        if (!plan || plan.error || !img || !objPath) throw new Error("không có ảnh plan để gửi");
        out.discord = await sendDiscord(c.hook, plan, img, objPath.split("/").pop() as string, symbol, warnings);
      } catch (e) {
        out.discord = { error: errMsg(e) };
      }
    }
    log(dbError ? "error" : "info", "POST xong", { via: c.via, date, symbol, db: dbError || "ok", image: out.image, discord: out.discord, duplicate, warnings: warnings.length, notify: p.notify !== false, hook: !!c.hook });
    if (dbError) return json({ ...dbError, ...out }, 502);
    return json(out);
  } catch (e) {
    log("error", "POST lỗi không bắt được", { error: errMsg(e) });
    return json({ error: errMsg(e) }, 500);
  }
}

export async function GET(req: Request) {
  const c = await setup(req);
  if ("error" in c) return c.error;
  try {
    const q = new URL(req.url).searchParams;
    const month = q.get("month");
    if (month) {
      if (!MONTH_RE.test(month)) return json({ error: "month phải dạng yyyy-MM" }, 400);
      const [y, m] = month.split("-").map(Number);
      const next = m === 12 ? `${y + 1}-01-01` : `${y}-${String(m + 1).padStart(2, "0")}-01`;
      const r = await fetch(
        `${c.rest}?select=trade_date,symbol,summary,image_path,updated_at&trade_date=gte.${month}-01&trade_date=lt.${next}&order=trade_date.asc`,
        { headers: c.hr, cache: "no-store" },
      );
      if (!r.ok) {
        const detail = (await r.text()).slice(0, 300);
        log("error", "GET month supabase lỗi", { status: r.status, detail });
        return json({ error: "supabase", status: r.status, detail }, 502);
      }
      return json({ month, plans: await r.json() });
    }
    const date = q.get("date") || "";
    if (date && !DATE_RE.test(date)) return json({ error: "date phải dạng yyyy-MM-dd" }, 400);
    const filter = date ? `&trade_date=eq.${date}` : "";
    const r = await fetch(
      `${c.rest}?select=trade_date,symbol,created_at,updated_at,summary,plan_text,image_path,payload${filter}&order=trade_date.desc,updated_at.desc&limit=1`,
      { headers: c.hr, cache: "no-store" },
    );
    if (!r.ok) {
      const detail = (await r.text()).slice(0, 300);
      log("error", "GET supabase lỗi", { status: r.status, detail });
      return json({ error: "supabase", status: r.status, detail }, 502);
    }
    const rows = (await r.json()) as Json[];
    if (!rows.length) return json({ error: "Chưa có plan" }, 404);
    const row = rows[0];
    if (row.image_path) {
      try {
        const s = await fetch(`${c.storage}/object/sign/${c.bucket}/${row.image_path}`, {
          method: "POST", headers: c.hj, body: JSON.stringify({ expiresIn: 3600 }),
        });
        if (s.ok) {
          const j = (await s.json()) as { signedURL?: string; signedUrl?: string };
          const u = j.signedURL || j.signedUrl;
          if (u) row.image_url = c.storage + u;
        }
      } catch { /* bỏ qua: vẫn trả plan */ }
    }
    return json(row);
  } catch (e) {
    return json({ error: errMsg(e) }, 500);
  }
}

function notAllowed() {
  return json({ error: "method not allowed" }, 405, { Allow: "GET, POST" });
}
export { notAllowed as PUT, notAllowed as PATCH, notAllowed as DELETE };
