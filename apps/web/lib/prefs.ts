// Tuỳ chọn giao diện lưu trong cookie (đọc được ở server để render đúng ngay lần đầu, không nhấp nháy).
// Dùng được cả server lẫn client (không import gì của server).

export type Lang = "vi" | "en";
export type SideMode = "pinned" | "collapsed";
export type UiPrefs = { lang: Lang; tz: string; side: SideMode };

export const UI_COOKIES = { lang: "desk_lang", tz: "desk_tz", side: "desk_side" } as const;

// Múi giờ hiển thị. Phiên trade, plan và journal vẫn tính theo ngày ET; múi giờ này dùng cho đồng hồ,
// giờ tin / news và cách nhóm ngày trong Calendar (chọn giờ VN thì khớp forexfactory.com xem ở VN).
export const TZS = [
  { id: "Asia/Ho_Chi_Minh", short: "VN", label: "Việt Nam (GMT+7)" },
  { id: "America/New_York", short: "ET", label: "New York (ET)" },
  { id: "America/Chicago", short: "CT", label: "Chicago (CT)" },
  { id: "UTC", short: "UTC", label: "UTC" },
  { id: "Europe/London", short: "LDN", label: "London" },
  { id: "Asia/Singapore", short: "SGT", label: "Singapore (GMT+8)" },
  { id: "Asia/Tokyo", short: "TYO", label: "Tokyo (GMT+9)" },
  { id: "Australia/Sydney", short: "SYD", label: "Sydney" },
] as const;

export const DEFAULT_UI: UiPrefs = { lang: "vi", tz: "Asia/Ho_Chi_Minh", side: "pinned" };

export function parseUi(get: (name: string) => string | undefined): UiPrefs {
  const lang = get(UI_COOKIES.lang) === "en" ? "en" : "vi";
  const tzRaw = get(UI_COOKIES.tz);
  const tz = TZS.some((t) => t.id === tzRaw) ? (tzRaw as string) : DEFAULT_UI.tz;
  const side = get(UI_COOKIES.side) === "collapsed" ? "collapsed" : "pinned";
  return { lang, tz, side };
}

export function tzShort(tz: string) {
  return TZS.find((t) => t.id === tz)?.short || tz;
}

export function writeCookie(name: string, value: string) {
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=31536000; samesite=lax`;
}
