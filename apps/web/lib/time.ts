// Giờ New York (ET, phiên NY AM) và giờ Việt Nam. Không cài thêm thư viện: dùng Intl.
export const TZ_ET = "America/New_York";
export const TZ_VN = "Asia/Ho_Chi_Minh";

export type EtNow = { date: string; hh: number; mm: number; dow: number; minutes: number };

function parts(d: Date, timeZone: string) {
  const f = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    weekday: "short",
  });
  const o: Record<string, string> = {};
  for (const p of f.formatToParts(d)) o[p.type] = p.value;
  const hh = Number(o.hour) % 24;
  const mm = Number(o.minute);
  const dow = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(o.weekday);
  return { date: `${o.year}-${o.month}-${o.day}`, hh, mm, dow, minutes: hh * 60 + mm };
}

export function etNow(d = new Date()): EtNow {
  return parts(d, TZ_ET);
}

export function etDateOf(ts: number) {
  return parts(new Date(ts), TZ_ET).date;
}

export function dateIn(ts: number, timeZone: string) {
  return parts(new Date(ts), timeZone).date;
}

export function nowIn(timeZone: string, d = new Date()) {
  return parts(d, timeZone);
}

export function hhmm(ts: number, timeZone: string) {
  const p = parts(new Date(ts), timeZone);
  return `${String(p.hh).padStart(2, "0")}:${String(p.mm).padStart(2, "0")}`;
}

export const SESSION_START = 9 * 60 + 30; // 09:30 ET
export const SESSION_END = 11 * 60 + 30; // 11:30 ET
export const PLAN_SEND = 9 * 60 + 29; // ATAS gửi plan lúc 09:29 ET

export function inSession(minutesEt: number) {
  return minutesEt >= SESSION_START && minutesEt <= SESSION_END;
}

// Ngày dạng YYYY-MM-DD (không phụ thuộc múi giờ máy chủ)
export function addDays(date: string, n: number) {
  const d = new Date(date + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export function dowOf(date: string) {
  return new Date(date + "T12:00:00Z").getUTCDay();
}

export function isWeekday(date: string) {
  const w = dowOf(date);
  return w >= 1 && w <= 5;
}

export function monthOf(date: string) {
  return date.slice(0, 7);
}

export function monthRange(month: string) {
  const [y, m] = month.split("-").map(Number);
  const start = `${month}-01`;
  const next = m === 12 ? `${y + 1}-01-01` : `${y}-${String(m + 1).padStart(2, "0")}-01`;
  const days = Math.round((Date.parse(next + "T00:00:00Z") - Date.parse(start + "T00:00:00Z")) / 864e5);
  return { start, next, days };
}

export function shiftMonth(month: string, n: number) {
  const [y, m] = month.split("-").map(Number);
  const t = y * 12 + (m - 1) + n;
  return `${Math.floor(t / 12)}-${String((t % 12) + 1).padStart(2, "0")}`;
}

export const DOW_VI = ["Chủ nhật", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"];
export const DOW_SHORT = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

export function viDate(date: string) {
  const [y, m, d] = date.split("-");
  return `${d}/${m}/${y}`;
}

export function viDayMonth(date: string) {
  const [, m, d] = date.split("-");
  return `${d}/${m}`;
}

export const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
export const MONTH_RE = /^\d{4}-\d{2}$/;

// Thứ 2 của tuần chứa ngày này (cuối tuần thì lấy tuần kế tiếp)
export function mondayOf(date: string) {
  const w = dowOf(date);
  return addDays(date, w === 0 ? 1 : w === 6 ? 2 : 1 - w);
}

export function fmtTime(ts: number, timeZone: string, withDate = false) {
  return new Date(ts).toLocaleString("en-GB", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    ...(withDate ? { day: "2-digit", month: "2-digit" } : {}),
  });
}
