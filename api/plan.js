// api/plan.js — Vercel Function (Node.js runtime, không cần thư viện ngoài)
//
// POST /api/plan   Header: Authorization: Bearer <PLAN_TOKEN>   Body: JSON từ "Deren · Plan Sender"
//                  → lưu (upsert theo ngày + symbol) vào bảng public.trade_plans trên Supabase
// GET  /api/plan[?date=YYYY-MM-DD]   Header: Authorization: Bearer <PLAN_TOKEN>
//                  → trả plan của ngày đó, hoặc plan mới nhất
//
// Biến môi trường trên Vercel: SUPABASE_URL, SUPABASE_SERVICE_KEY (hoặc SUPABASE_SECRET_KEY / SUPABASE_SERVICE_ROLE_KEY), PLAN_TOKEN
//
// Ghi chú: file dùng cú pháp ES module (export default). Nếu sau khi deploy, mở /api/plan
// mà không thấy {"error":"unauthorized"} (ví dụ 500 do lỗi module), đổi tên file thành api/plan.mjs.
// Nếu repo là Next.js App Router thì dùng route handler app/api/plan/route.js thay vì file này.

const TABLE = "trade_plans";

function supaHeaders(key) {
  const h = { apikey: key, "Content-Type": "application/json" };
  // Key dạng JWT cũ (service_role, bắt đầu "eyJ") gửi thêm Authorization.
  // Key mới "sb_secret_..." chỉ cần header apikey.
  if (key.startsWith("eyJ")) h.Authorization = "Bearer " + key;
  return h;
}

function safeEqual(a, b) {
  if (typeof a !== "string" || typeof b !== "string" || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  const env = process.env;
  // Nhận cả tên biến do tích hợp Supabase ↔ Vercel tự tạo (SUPABASE_SECRET_KEY / SUPABASE_SERVICE_ROLE_KEY).
  const SUPABASE_URL = env.SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL;
  const SUPABASE_SERVICE_KEY = env.SUPABASE_SERVICE_KEY || env.SUPABASE_SECRET_KEY || env.SUPABASE_SERVICE_ROLE_KEY;
  const PLAN_TOKEN = env.PLAN_TOKEN;
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || !PLAN_TOKEN) {
    return res.status(500).json({ error: "Thiếu biến môi trường SUPABASE_URL / SUPABASE_SERVICE_KEY / PLAN_TOKEN" });
  }

  const token = String(req.headers.authorization || "").replace(/^Bearer\s+/i, "").trim();
  if (!safeEqual(token, PLAN_TOKEN)) return res.status(401).json({ error: "unauthorized" });

  const base = SUPABASE_URL.replace(/\/$/, "") + "/rest/v1/" + TABLE;
  const h = supaHeaders(SUPABASE_SERVICE_KEY);

  try {
    if (req.method === "POST") {
      const p = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
      if (!p || !/^\d{4}-\d{2}-\d{2}$/.test(p.date || "") || !p.prth || !p.ovn) {
        return res.status(400).json({ error: "Payload thiếu date (yyyy-MM-dd), prth hoặc ovn" });
      }
      const row = { trade_date: p.date, symbol: String(p.symbol || "NQ").slice(0, 20), price: p.price ?? null, payload: p };
      const r = await fetch(base + "?on_conflict=trade_date,symbol", {
        method: "POST",
        headers: { ...h, Prefer: "resolution=merge-duplicates,return=minimal" },
        body: JSON.stringify(row),
      });
      if (!r.ok) return res.status(502).json({ error: "supabase", status: r.status, detail: (await r.text()).slice(0, 300) });
      return res.status(200).json({ ok: true, date: p.date, symbol: row.symbol });
    }

    if (req.method === "GET") {
      const date = String((req.query && req.query.date) || "");
      if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) return res.status(400).json({ error: "date phải dạng yyyy-MM-dd" });
      const filter = date ? `&trade_date=eq.${date}` : "";
      const r = await fetch(`${base}?select=trade_date,symbol,price,payload,updated_at${filter}&order=trade_date.desc,updated_at.desc&limit=1`, { headers: h });
      if (!r.ok) return res.status(502).json({ error: "supabase", status: r.status, detail: (await r.text()).slice(0, 300) });
      const rows = await r.json();
      if (!rows.length) return res.status(404).json({ error: "Chưa có plan" });
      return res.status(200).json(rows[0]);
    }

    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ error: "method not allowed" });
  } catch (e) {
    return res.status(500).json({ error: String((e && e.message) || e) });
  }
}
