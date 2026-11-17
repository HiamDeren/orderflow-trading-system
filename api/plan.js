// api/plan.js — Vercel Function (Node.js runtime)
//
// POST /api/plan   Header: Authorization: Bearer <PLAN_TOKEN>   Body: JSON v1 từ indicator "Deren · Plan Sender"
//   1. Lưu (upsert theo ngày + symbol) vào bảng trading.trade_plans trên Supabase (schema riêng, không dùng public)
//   2. Lập plan bằng assets/js/plan-core.js (cùng code với trang Trade Plan), vẽ ảnh tiếng Việt, đổi sang PNG
//   3. Lưu PNG vào Supabase Storage (bucket private "trade-plans"), ghi đường dẫn + plan chữ vào bảng
//   4. Gửi ảnh + tóm tắt plan lên Discord (nếu có DISCORD_WEBHOOK_TRADE_PLAN và payload không có "notify": false)
//   Bước 2–4 lỗi thì plan vẫn được lưu; kết quả từng bước nằm trong response.
//
// GET  /api/plan[?date=YYYY-MM-DD]   Header: Authorization: Bearer <PLAN_TOKEN>
//   → plan của ngày đó (hoặc mới nhất) + image_url (link ký tạm 1 giờ) nếu đã có ảnh
//
// Biến môi trường trên Vercel:
//   SUPABASE_URL, SUPABASE_SERVICE_KEY (hoặc SUPABASE_SECRET_KEY / SUPABASE_SERVICE_ROLE_KEY), PLAN_TOKEN,
//   DISCORD_WEBHOOK_TRADE_PLAN (tuỳ chọn; tên cũ DISCORD_WEBHOOK_URL vẫn nhận), PLAN_BUCKET (tuỳ chọn, mặc định "trade-plans")
//   Schema "trading" phải nằm trong Exposed schemas (Supabase → Project Settings → Data API).

import path from "path";
import { Resvg } from "@resvg/resvg-js";
import core from "../assets/js/plan-core.js";

const SCHEMA = "trading";
const TABLE = "trade_plans";
const FONT_DIR = path.join(process.cwd(), "api", "_fonts");
const FONT_FILES = ["BeVietnamPro-Regular.ttf", "BeVietnamPro-Bold.ttf", "JetBrainsMono-Regular.ttf", "JetBrainsMono-Bold.ttf"]
  .map(f => path.join(FONT_DIR, f));

function supaHeaders(key) {
  const h = { apikey: key };
  // Key dạng JWT cũ (service_role, bắt đầu "eyJ") gửi thêm Authorization. Key mới "sb_secret_..." chỉ cần apikey.
  if (key.startsWith("eyJ")) h.Authorization = "Bearer " + key;
  return h;
}

function safeEqual(a, b) {
  if (typeof a !== "string" || typeof b !== "string" || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function svgToPng(svg) {
  const r = new Resvg(svg, {
    fitTo: { mode: "zoom", value: 2 },
    font: { fontFiles: FONT_FILES, loadSystemFonts: false, defaultFontFamily: "Be Vietnam Pro" },
  });
  return Buffer.from(r.render().asPng());
}

function imagePath(date, symbol) {
  const safe = String(symbol).replace(/[^A-Za-z0-9_-]/g, "_");
  return `${date.slice(0, 4)}/${date.slice(5, 7)}/plan_${date}_${safe}.png`;
}

async function sendDiscord(webhook, plan, png, fileName, symbol) {
  const s = plan.summary;
  const color = s.bias === "Lên" ? 0x3fbf7f : s.bias === "Xuống" ? 0xef5350 : 0x9aa0a8;
  const lines = [
    `**Bias:** ${s.bias} · ${s.conf}`,
    `**Vị trí:** ${s.location}${s.zone ? ` (HVN ${core.fmt(s.zone.lo)}–${core.fmt(s.zone.hi)})` : ""}`,
    `**Setup:** ${s.setup}`,
    `**Target:** ${s.target != null ? `${core.fmt(s.target)} (cách giá 9:29 ${core.fmt(s.distance)} điểm)` : "theo mô tả setup"}`,
    `**Đổi bias:** ${s.flip}`,
    `**Giá 9:29:** ${core.fmt(s.price)} · Prev RTH ${core.lc1(s.prth)} · OVN ${core.lc1(s.ovn)}`,
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
  fd.append("files[0]", new Blob([png], { type: "image/png" }), fileName);
  const r = await fetch(webhook, { method: "POST", body: fd });
  if (!r.ok) throw new Error(`discord ${r.status}: ${(await r.text()).slice(0, 200)}`);
  return { sent: true };
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  const env = process.env;
  // Nhận cả tên biến do tích hợp Supabase ↔ Vercel tự tạo (SUPABASE_SECRET_KEY / SUPABASE_SERVICE_ROLE_KEY).
  const SUPABASE_URL = (env.SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/\/$/, "");
  const SUPABASE_SERVICE_KEY = env.SUPABASE_SERVICE_KEY || env.SUPABASE_SECRET_KEY || env.SUPABASE_SERVICE_ROLE_KEY;
  const PLAN_TOKEN = env.PLAN_TOKEN;
  const BUCKET = env.PLAN_BUCKET || "trade-plans";
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || !PLAN_TOKEN) {
    return res.status(500).json({ error: "Thiếu biến môi trường SUPABASE_URL / SUPABASE_SERVICE_KEY / PLAN_TOKEN" });
  }

  const token = String(req.headers.authorization || "").replace(/^Bearer\s+/i, "").trim();
  if (!safeEqual(token, PLAN_TOKEN)) return res.status(401).json({ error: "unauthorized" });

  const rest = SUPABASE_URL + "/rest/v1/" + TABLE;
  const storage = SUPABASE_URL + "/storage/v1";
  const h = supaHeaders(SUPABASE_SERVICE_KEY);
  const hj = { ...h, "Content-Type": "application/json" };
  // PostgREST chọn schema qua header: Accept-Profile (đọc), Content-Profile (ghi). Storage không cần.
  const hr = { ...h, "Accept-Profile": SCHEMA };
  const hw = { ...hj, "Content-Profile": SCHEMA };

  try {
    if (req.method === "POST") {
      const p = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
      if (!p || !/^\d{4}-\d{2}-\d{2}$/.test(p.date || "") || !p.prth || !p.ovn) {
        return res.status(400).json({ error: "Payload thiếu date (yyyy-MM-dd), prth hoặc ovn" });
      }
      const symbol = String(p.symbol || "NQ").slice(0, 20);
      const row = { trade_date: p.date, symbol, payload: p };
      const r = await fetch(rest + "?on_conflict=trade_date,symbol", {
        method: "POST",
        headers: { ...hw, Prefer: "resolution=merge-duplicates,return=minimal" },
        body: JSON.stringify(row),
      });
      if (!r.ok) return res.status(502).json({ error: "supabase", status: r.status, detail: (await r.text()).slice(0, 300) });

      const out = { ok: true, date: p.date, symbol, image: null, discord: null };
      let plan = null, png = null, objPath = null;

      // 2–3. Lập plan, vẽ ảnh, lưu Storage
      try {
        plan = core.planFromJson(p);
        if (plan.error) throw new Error(plan.error);
        png = svgToPng(plan.svg);
        objPath = imagePath(p.date, symbol);
        const up = await fetch(`${storage}/object/${BUCKET}/${objPath}`, {
          method: "POST",
          headers: { ...h, "Content-Type": "image/png", "x-upsert": "true", "cache-control": "no-cache" },
          body: png,
        });
        if (!up.ok) throw new Error(`storage ${up.status}: ${(await up.text()).slice(0, 200)}`);
        const upd = await fetch(`${rest}?trade_date=eq.${p.date}&symbol=eq.${encodeURIComponent(symbol)}`, {
          method: "PATCH",
          headers: { ...hw, Prefer: "return=minimal" },
          body: JSON.stringify({ image_path: objPath, plan_text: plan.text, summary: plan.summary }),
        });
        if (!upd.ok) throw new Error(`update ${upd.status}: ${(await upd.text()).slice(0, 200)}`);
        out.image = { path: objPath, bytes: png.length };
      } catch (e) {
        out.image = { error: String((e && e.message) || e) };
      }

      // 4. Discord
      const hook = env.DISCORD_WEBHOOK_TRADE_PLAN || env.DISCORD_WEBHOOK_URL;
      if (hook && p.notify !== false) {
        try {
          if (!plan || plan.error || !png) throw new Error("không có ảnh plan để gửi");
          out.discord = await sendDiscord(hook, plan, png, objPath.split("/").pop(), symbol);
        } catch (e) {
          out.discord = { error: String((e && e.message) || e) };
        }
      }
      return res.status(200).json(out);
    }

    if (req.method === "GET") {
      const date = String((req.query && req.query.date) || "");
      if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) return res.status(400).json({ error: "date phải dạng yyyy-MM-dd" });
      const filter = date ? `&trade_date=eq.${date}` : "";
      const r = await fetch(`${rest}?select=trade_date,symbol,created_at,updated_at,summary,plan_text,image_path,payload${filter}&order=trade_date.desc,updated_at.desc&limit=1`, { headers: hr });
      if (!r.ok) return res.status(502).json({ error: "supabase", status: r.status, detail: (await r.text()).slice(0, 300) });
      const rows = await r.json();
      if (!rows.length) return res.status(404).json({ error: "Chưa có plan" });
      const row = rows[0];
      if (row.image_path) {
        try {
          const s = await fetch(`${storage}/object/sign/${BUCKET}/${row.image_path}`, {
            method: "POST", headers: hj, body: JSON.stringify({ expiresIn: 3600 }),
          });
          if (s.ok) { const j = await s.json(); const u = j.signedURL || j.signedUrl; if (u) row.image_url = storage + u; }
        } catch (e) { /* bỏ qua: vẫn trả plan */ }
      }
      return res.status(200).json(row);
    }

    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ error: "method not allowed" });
  } catch (e) {
    return res.status(500).json({ error: String((e && e.message) || e) });
  }
}
