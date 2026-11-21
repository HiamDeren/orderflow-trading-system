// Journal: kiểu dữ liệu, đọc / ghi bảng trading.journal_entries + journal_trades (+ tags n:n), thống kê.
// Mọi bảng nối về trading.trade_days qua day_id (trigger điền từ trade_date). Lưu qua RPC trading.save_journal (một giao dịch).
import { db } from "@/lib/db";
import core from "@/lib/plan-core";
import {
  BIAS_CHECK, DAY_TYPES, FOLLOWED, HVN_EDGES, IB_WIDTHS, OPEN_DIRS, OPEN_TYPES, PRE_BIAS, REACH, RESULTS, SETUPS, SIDES,
} from "@/lib/settings";
import { monthRange } from "@/lib/time";

export const TEXT_FIELDS = [
  ["context", "Context · TPO", "Mở cửa so với value, IB, single prints, cấu trúc profile"],
  ["session_story", "Diễn biến phiên", "Mở cửa, IB, mở rộng range, các nhịp chính trong phiên"],
  ["plan_vs_actual", "Plan so với thực tế", "Bias, kịch bản chính, điểm đổi ý: cái nào đúng, cái nào sai"],
  ["trade_review", "Chấm từng lệnh", "Lệnh 1: level, trigger, quản lý, thoát · điểm A/B/C"],
  ["orderflow", "Footprint · DOM · tape", "Absorption, imbalance, CVD, lệnh lớn trên DOM tại điểm vào"],
  ["process_score", "Điểm quy trình", "Chuẩn bị, chờ trigger, quản lý rủi ro, giữ giới hạn lệnh · thang 1–10"],
  ["psychology", "Tâm lý & kỷ luật", "Lúc nào vội, lúc nào do dự, có phá luật nào không"],
  ["next_levels", "Level cho ngày mai", "Các vùng TPO / VPO cần để ý cho phiên sau"],
  ["lesson", "Bài học", "Một câu ngắn để nhớ"],
] as const;

export type TextKey = (typeof TEXT_FIELDS)[number][0];

// Log phiên (T12): khung trước phiên + diễn biến so với HVN. Lựa chọn: [giá trị lưu, nhãn hiển thị].
type Opt = readonly [string, string];
const kv = (list: readonly string[]): Opt[] => list.map((x) => [x, x] as const);
const fromCore = (list: { k: string; n: string }[]): Opt[] => list.map((o) => [o.k, o.n] as const);
export const SESSION_FIELDS = [
  ["comp_pos", "Vị trí composite", fromCore(core.P_OPTS)],
  ["prth_build", "pRTH build", fromCore(core.B_OPTS)],
  ["ovn_build", "OVN", fromCore(core.O_OPTS)],
  ["pre_bias", "Bias trước phiên", kv(PRE_BIAS)],
  ["open_dir", "Hướng open type", kv(OPEN_DIRS)],
  ["ib_width", "IB", kv(IB_WIDTHS)],
  ["hvn_edge", "Phản ứng ở mép HVN", kv(HVN_EDGES)],
  ["reach_next", "Tới HVN kế tiếp?", kv(REACH)],
] as const satisfies readonly (readonly [string, string, Opt[]])[];
export type SessionKey = (typeof SESSION_FIELDS)[number][0];
export type SessionField = readonly [string, string, Opt[]];

// Điền sẵn khung trước phiên từ plan (summary lưu tên P/B/O, đổi lại thành khoá)
export function presetFromPlan(summary: { location?: string; prth?: string; ovn?: string; bias?: string } | null | undefined) {
  if (!summary) return {};
  const key = (list: { k: string; n: string }[], n?: string) => list.find((o) => o.n === n)?.k || "";
  return {
    comp_pos: key(core.P_OPTS, summary.location),
    prth_build: key(core.B_OPTS, summary.prth),
    ovn_build: key(core.O_OPTS, summary.ovn),
    pre_bias: PRE_BIAS.includes(summary.bias as never) ? (summary.bias as string) : "",
  } as Partial<Record<SessionKey, string>>;
}

export type Trade = {
  id?: string;
  seq?: number;
  entry_time: string | null;
  side: string;
  qty: number;
  setup: string | null;
  level: string | null;
  trigger: string | null;
  r: number | null;
  pnl: number | null;
  fee: number;
  followed_plan: string | null;
  mistakes: string[];
  tags?: { kind: string; name: string }[];
};

export type JournalDay = {
  id?: string;
  day_id?: string;
  trade_date: string;
  symbol: string;
  day_type: string | null;
  result: string | null;
  open_type: string | null;
  bias_correct: string | null;
  updated_at?: string;
} & Record<SessionKey, string | null> & Record<TextKey, string | null>;

export type DayWithTrades = JournalDay & { journal_trades?: Trade[] };

const TABLE_DAYS = "journal_entries";
const EMBED = "select=*,journal_trades(*,tags(kind,name))";

const num = (v: unknown) => (v === null || v === undefined || v === "" ? null : Number(v));

// Lỗi của lệnh: mảng hoặc chuỗi cách nhau dấu phẩy → tag kind "mistake"
export function mistakesOf(t: Partial<Trade> & { mistake?: unknown }): string[] {
  const raw = Array.isArray(t.mistakes) ? t.mistakes : typeof t.mistake === "string" ? t.mistake.split(",") : [];
  return [...new Set(raw.map((x) => String(x).trim().slice(0, 60)).filter(Boolean))].slice(0, 8);
}

// Đọc từ DB: tags (n:n) → mistakes
function withMistakes(d: DayWithTrades): DayWithTrades {
  return {
    ...d,
    journal_trades: (d.journal_trades || []).map((t) => ({ ...t, mistakes: (t.tags || []).filter((g) => g.kind === "mistake").map((g) => g.name) })),
  };
}

export function normTrade(t: Partial<Trade>, i: number): Trade {
  return {
    seq: i + 1,
    entry_time: t.entry_time ? String(t.entry_time).slice(0, 5) : null,
    side: SIDES.includes(t.side as never) ? (t.side as string) : "Long",
    qty: Math.max(1, Math.round(Number(t.qty) || 1)),
    setup: SETUPS.some(([k]) => k === t.setup) ? (t.setup as string) : null,
    level: t.level ? String(t.level).slice(0, 120) : null,
    trigger: t.trigger ? String(t.trigger).slice(0, 200) : null,
    r: Number.isFinite(num(t.r)) ? (num(t.r) as number) : null,
    pnl: Number.isFinite(num(t.pnl)) ? (num(t.pnl) as number) : null,
    fee: Number.isFinite(num(t.fee)) ? (num(t.fee) as number) : 0,
    followed_plan: FOLLOWED.includes(t.followed_plan as never) ? (t.followed_plan as string) : null,
    mistakes: mistakesOf(t),
  };
}

function pick<T extends readonly string[]>(list: T, v: unknown) {
  return list.includes(v as never) ? (v as string) : null;
}

export function normDay(input: Record<string, unknown>): JournalDay {
  const day = {
    trade_date: String(input.trade_date),
    symbol: String(input.symbol || "NQ").slice(0, 20),
    day_type: pick(DAY_TYPES, input.day_type),
    result: pick(RESULTS, input.result),
    open_type: pick(OPEN_TYPES, input.open_type),
    bias_correct: pick(BIAS_CHECK, input.bias_correct),
  } as JournalDay;
  for (const [k, , opts] of SESSION_FIELDS) day[k] = opts.some(([v]) => v === input[k]) ? (input[k] as string) : null;
  // Open auction không có hướng
  if (day.open_type === "Open auction") day.open_dir = null;
  for (const [k] of TEXT_FIELDS) {
    const v = input[k];
    day[k] = typeof v === "string" && v.trim() ? v.slice(0, 8000) : null;
  }
  return day;
}

export async function getDay(date: string, symbol = "NQ"): Promise<DayWithTrades | null> {
  const rows = await db.select<DayWithTrades>(
    TABLE_DAYS,
    `${EMBED}&trade_date=eq.${date}&symbol=eq.${encodeURIComponent(symbol)}&journal_trades.order=seq.asc`,
  );
  return rows[0] ? withMistakes(rows[0]) : null;
}

export async function getDaysBetween(start: string, endExclusive: string): Promise<DayWithTrades[]> {
  const rows = await db.select<DayWithTrades>(
    TABLE_DAYS,
    `${EMBED}&trade_date=gte.${start}&trade_date=lt.${endExclusive}&order=trade_date.asc&journal_trades.order=seq.asc`,
  );
  return rows.map(withMistakes);
}

export function getMonth(month: string) {
  const { start, next } = monthRange(month);
  return getDaysBetween(start, next);
}

export async function getRecentDays(limit = 20): Promise<DayWithTrades[]> {
  const rows = await db.select<DayWithTrades>(
    TABLE_DAYS,
    `${EMBED}&order=trade_date.desc&limit=${limit}&journal_trades.order=seq.asc`,
  );
  return rows.map(withMistakes);
}

export async function saveDay(dayIn: Record<string, unknown>, tradesIn: Partial<Trade>[]) {
  const day = normDay(dayIn);
  const trades = tradesIn.slice(0, 20).map(normTrade);
  await db.rpc<string>("save_journal", { p: { ...day, trades } });
  return getDay(day.trade_date, day.symbol);
}

// ---------- thống kê ----------
export function dayNet(d: DayWithTrades) {
  const t = d.journal_trades || [];
  const gross = t.reduce((a, x) => a + (Number(x.pnl) || 0), 0);
  const fee = t.reduce((a, x) => a + (Number(x.fee) || 0), 0);
  const r = t.reduce((a, x) => a + (Number(x.r) || 0), 0);
  return { gross, fee, net: gross - fee, r, n: t.length };
}

export type Stats = {
  days: number;
  winRate: number | null;
  avgR: number | null;
  followed: number | null;
  biasOk: number | null;
  byType: { name: string; r: number; n: number }[];
  mistakes: { name: string; n: number }[];
  session: SessionStats;
};

// Tỉ lệ k / n kèm khoảng tin cậy Wilson 95% (mẫu nhỏ thì khoảng rộng, đừng kết luận sớm)
export type Rate = { k: number; n: number; pct: number | null; lo: number | null; hi: number | null };
export function rate(k: number, n: number): Rate {
  if (!n) return { k, n, pct: null, lo: null, hi: null };
  const z = 1.96, p = k / n, d = 1 + (z * z) / n;
  const c = (p + (z * z) / (2 * n)) / d;
  const h = (z * Math.sqrt((p * (1 - p)) / n + (z * z) / (4 * n * n))) / d;
  return { k, n, pct: Math.round(p * 100), lo: Math.round(Math.max(0, c - h) * 100), hi: Math.round(Math.min(1, c + h) * 100) };
}

export type SessionStats = {
  logged: number;
  biasOk: Rate;
  edgeHeld: Rate;
  reachNext: Rate;
  bySetup: { key: string; name: string; n: number; win: Rate; avgR: number | null }[];
};

export function sessionStatsOf(days: DayWithTrades[]): SessionStats {
  const logged = days.filter((d) => d.comp_pos || d.hvn_edge || d.pre_bias);
  const bias = days.filter((d) => d.bias_correct);
  const touched = days.filter((d) => d.hvn_edge && d.hvn_edge !== "Không chạm mép");
  const accepted = days.filter((d) => d.hvn_edge === "Chấp nhận ra ngoài" && d.reach_next && d.reach_next !== "Không áp dụng");
  const trades = days.flatMap((d) => d.journal_trades || []).filter((t) => t.setup && t.r !== null && t.r !== undefined);
  return {
    logged: logged.length,
    biasOk: rate(bias.filter((d) => d.bias_correct === "Đúng").length, bias.length),
    edgeHeld: rate(touched.filter((d) => d.hvn_edge === "Giữ (fade đúng)").length, touched.length),
    reachNext: rate(accepted.filter((d) => d.reach_next === "Có").length, accepted.length),
    bySetup: SETUPS.map(([key, name]) => {
      const t = trades.filter((x) => x.setup === key);
      const sum = t.reduce((a, x) => a + Number(x.r), 0);
      return { key, name, n: t.length, win: rate(t.filter((x) => Number(x.r) > 0).length, t.length), avgR: t.length ? sum / t.length : null };
    }),
  };
}

const pct = (a: number, b: number) => (b ? Math.round((a / b) * 100) : null);

export function statsOf(days: DayWithTrades[]): Stats {
  const decided = days.filter((d) => d.result && d.result !== "No Trade");
  const wins = decided.filter((d) => d.result === "Win").length;
  const trades = days.flatMap((d) => d.journal_trades || []);
  const withR = trades.filter((t) => t.r !== null && t.r !== undefined);
  const avgR = withR.length ? withR.reduce((a, t) => a + Number(t.r), 0) / withR.length : null;
  const withPlan = trades.filter((t) => t.followed_plan);
  const followed = pct(withPlan.filter((t) => t.followed_plan === "Có").length, withPlan.length);
  const biasDays = days.filter((d) => d.bias_correct);
  const biasOk = pct(biasDays.filter((d) => d.bias_correct === "Đúng").length, biasDays.length);
  const byTypeMap = new Map<string, { r: number; n: number }>();
  for (const d of days) {
    if (!d.day_type) continue;
    const cur = byTypeMap.get(d.day_type) || { r: 0, n: 0 };
    cur.r += dayNet(d).r;
    cur.n += 1;
    byTypeMap.set(d.day_type, cur);
  }
  const mist = new Map<string, number>();
  for (const t of trades)
    for (const m of t.mistakes || []) {
      if (/^không lỗi$/i.test(m)) continue;
      mist.set(m, (mist.get(m) || 0) + 1);
    }
  return {
    days: days.length,
    winRate: pct(wins, decided.length),
    avgR,
    followed,
    biasOk,
    byType: [...byTypeMap].map(([name, v]) => ({ name, ...v })).sort((a, b) => b.r - a.r),
    mistakes: [...mist].map(([name, n]) => ({ name, n })).sort((a, b) => b.n - a.n).slice(0, 6),
    session: sessionStatsOf(days),
  };
}
