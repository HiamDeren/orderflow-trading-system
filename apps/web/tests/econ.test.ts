// Lịch kinh tế (feed ForexFactory tuần): parse, giờ ET, cả ngày, lỗi nguồn, đổi múi giờ hiển thị.
import { afterEach, describe, expect, it, vi } from "vitest";
import { getEconWeek, localize, topImpact } from "@/lib/econ";

const FEED = [
  { title: "Core CPI m/m", country: "USD", date: "2026-11-18T08:30:00-05:00", impact: "High", forecast: "0.3%", previous: "0.2%" },
  { title: "Bank Holiday", country: "JPY", date: "2026-11-17T00:00:00-05:00", impact: "Holiday" },
  { title: "FOMC Minutes", country: "USD", date: "2026-11-19T14:00:00-05:00", impact: "high", forecast: "", previous: "" },
  { title: "Retail Sales", country: "usd", date: "2026-11-18T10:00:00-05:00", impact: "Medium" },
  { title: "Lỗi ngày", country: "USD", date: "không phải ngày", impact: "Low" },
  { title: "", country: "EUR", date: "2026-11-18T05:00:00-05:00", impact: "weird" },
];

function mockFetch(body: unknown, init: { status?: number } = {}) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => new Response(JSON.stringify(body), { status: init.status ?? 200, headers: { date: "Fri, 20 Nov 2026 12:00:00 GMT" } })),
  );
}

afterEach(() => vi.unstubAllGlobals());

describe("econ · getEconWeek", () => {
  it("parse feed, bỏ dòng ngày sai, sắp theo thời gian", async () => {
    mockFetch(FEED);
    const w = await getEconWeek();
    expect(w.ok).toBe(true);
    expect(w.events.map((e) => e.title)).toEqual(["Bank Holiday", "(không tên)", "Core CPI m/m", "Retail Sales", "FOMC Minutes"]);
    expect(w.fetchedAt).toBe("Fri, 20 Nov 2026 12:00:00 GMT");
  });

  it("giờ ET, mức tác động, trong phiên, cả ngày", async () => {
    mockFetch(FEED);
    const by = Object.fromEntries((await getEconWeek()).events.map((e) => [e.title, e]));
    expect(by["Core CPI m/m"]).toMatchObject({ timeEt: "08:30", dateEt: "2026-11-18", impact: "High", inSession: false, allDay: false });
    expect(by["Retail Sales"]).toMatchObject({ timeEt: "10:00", country: "USD", impact: "Medium", inSession: true });
    expect(by["FOMC Minutes"].impact).toBe("High");
    expect(by["Bank Holiday"]).toMatchObject({ allDay: true, timeEt: "Cả ngày", timeLocal: "" });
    expect(by["(không tên)"].impact).toBe("Low");
  });

  it("nguồn lỗi → ok:false, không ném", async () => {
    mockFetch({ x: 1 }, { status: 503 });
    const w = await getEconWeek();
    expect(w).toMatchObject({ ok: false, events: [] });
    expect(w.error).toContain("503");
  });

  it("dữ liệu không phải mảng → ok:false", async () => {
    mockFetch({ not: "array" });
    expect((await getEconWeek()).ok).toBe(false);
  });
});

describe("econ · localize / topImpact", () => {
  it("đổi sang giờ VN: CPI 08:30 ET = 20:30 VN cùng ngày", async () => {
    mockFetch(FEED);
    const vn = localize((await getEconWeek()).events, "Asia/Ho_Chi_Minh");
    const cpi = vn.find((e) => e.title === "Core CPI m/m")!;
    expect(cpi).toMatchObject({ dateLocal: "2026-11-18", timeLocal: "20:30", timeEt: "08:30" });
    const fomc = vn.find((e) => e.title === "FOMC Minutes")!;
    expect(fomc).toMatchObject({ dateLocal: "2026-11-20", timeLocal: "02:00" });
  });

  it("topImpact", () => {
    expect(topImpact([])).toBeNull();
    expect(topImpact([{ impact: "Low" }, { impact: "High" }, { impact: "Medium" }])).toBe("High");
  });
});
