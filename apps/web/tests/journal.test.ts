// Journal: chuẩn hoá dữ liệu trước khi gọi save_journal và thống kê (Wilson 95%). Không gọi database.
import { describe, expect, it } from "vitest";
import { type DayWithTrades, dayNet, mistakesOf, normDay, normTrade, presetFromPlan, rate, statsOf } from "@/lib/journal";

describe("journal · normTrade", () => {
  it("giá trị lạ → mặc định an toàn", () => {
    const t = normTrade({ side: "Sideways" as never, qty: -3, setup: "X", r: "abc" as never, fee: undefined as never, entry_time: "09:45:30" }, 0);
    expect(t).toMatchObject({ seq: 1, side: "Long", qty: 1, setup: null, r: null, fee: 0, entry_time: "09:45", mistakes: [] });
  });

  it("giữ giá trị hợp lệ, cắt chuỗi dài", () => {
    const t = normTrade({ side: "Short", qty: 2.6, setup: "F", r: "1.5" as never, pnl: -200, fee: 4.2, followed_plan: "Có", level: "x".repeat(200) }, 2);
    expect(t).toMatchObject({ seq: 3, side: "Short", qty: 3, setup: "F", r: 1.5, pnl: -200, fee: 4.2, followed_plan: "Có" });
    expect(t.level).toHaveLength(120);
  });
});

describe("journal · mistakesOf", () => {
  it("mảng hoặc chuỗi phẩy, bỏ trùng, tối đa 8", () => {
    expect(mistakesOf({ mistakes: [" FOMO ", "FOMO", "", "Vào sớm"] })).toEqual(["FOMO", "Vào sớm"]);
    expect(mistakesOf({ mistake: "a, b ,a" } as never)).toEqual(["a", "b"]);
    expect(mistakesOf({ mistakes: Array.from({ length: 12 }, (_, i) => `m${i}`) })).toHaveLength(8);
  });
});

describe("journal · normDay", () => {
  it("chỉ nhận giá trị trong danh sách, Open auction bỏ hướng", () => {
    const d = normDay({
      trade_date: "2026-11-20",
      day_type: "Trending day",
      result: "Thắng",
      open_type: "Open auction",
      open_dir: "Lên",
      context: "  ",
      lesson: "Chờ trigger",
    });
    expect(d).toMatchObject({
      trade_date: "2026-11-20",
      symbol: "NQ",
      day_type: "Trending day",
      result: null,
      open_type: "Open auction",
      open_dir: null,
      context: null,
      lesson: "Chờ trigger",
    });
  });
});

describe("journal · rate (Wilson 95%)", () => {
  it("n = 0", () => expect(rate(0, 0)).toEqual({ k: 0, n: 0, pct: null, lo: null, hi: null }));
  it("7/10", () => expect(rate(7, 10)).toEqual({ k: 7, n: 10, pct: 70, lo: 40, hi: 89 }));
  it("10/10 không vượt 100", () => expect(rate(10, 10).hi).toBe(100));
});

describe("journal · dayNet / statsOf", () => {
  const day = (over: Partial<DayWithTrades>): DayWithTrades =>
    ({
      trade_date: "2026-11-20",
      symbol: "NQ",
      day_type: null,
      result: null,
      open_type: null,
      bias_correct: null,
      journal_trades: [],
      ...over,
    }) as DayWithTrades;
  const tr = (r: number, pnl: number, extra = {}) => ({
    entry_time: null,
    side: "Long",
    qty: 1,
    setup: "F",
    level: null,
    trigger: null,
    r,
    pnl,
    fee: 5,
    followed_plan: "Có",
    mistakes: [],
    ...extra,
  });

  it("dayNet trừ phí", () => {
    expect(dayNet(day({ journal_trades: [tr(1, 300), tr(-0.5, -150)] }))).toEqual({ gross: 150, fee: 10, net: 140, r: 0.5, n: 2 });
  });

  it("statsOf: win rate bỏ No Trade, R trung bình, lỗi hay gặp", () => {
    const s = statsOf([
      day({ result: "Win", day_type: "Normal day", bias_correct: "Đúng", journal_trades: [tr(2, 400, { mistakes: ["FOMO"] })] }),
      day({ result: "Loss", day_type: "Normal day", bias_correct: "Sai", journal_trades: [tr(-1, -200, { mistakes: ["FOMO", "Không lỗi"] })] }),
      day({ result: "No Trade" }),
    ]);
    expect(s).toMatchObject({ days: 3, winRate: 50, avgR: 0.5, followed: 100, biasOk: 50 });
    expect(s.byType).toEqual([{ name: "Normal day", r: 1, n: 2 }]);
    expect(s.mistakes).toEqual([{ name: "FOMO", n: 2 }]);
    expect(s.session.bySetup.find((x) => x.key === "F")).toMatchObject({ n: 2, avgR: 0.5 });
  });
});

describe("journal · presetFromPlan", () => {
  it("không có plan → rỗng", () => expect(presetFromPlan(null)).toEqual({}));
  it("bias ngoài danh sách → chuỗi rỗng", () => expect(presetFromPlan({ bias: "???" }).pre_bias).toBe(""));
});
