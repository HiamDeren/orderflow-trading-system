// Giờ ET / VN qua các mốc DST của Mỹ (VN không có DST). Plan gửi 09:29 ET, phiên 09:30–11:30 ET.
import { describe, expect, it } from "vitest";
import { addDays, dateIn, etDateOf, etNow, hhmm, inSession, isWeekday, mondayOf, monthRange, shiftMonth, TZ_VN } from "@/lib/time";

describe("time · DST", () => {
  it("09:30 ET mùa đông = 21:30 VN (UTC-5)", () => {
    const ts = Date.parse("2026-11-20T14:30:00Z");
    expect(hhmm(ts, "America/New_York")).toBe("09:30");
    expect(hhmm(ts, TZ_VN)).toBe("21:30");
  });

  it("09:30 ET mùa hè = 20:30 VN (UTC-4)", () => {
    const ts = Date.parse("2026-07-15T13:30:00Z");
    expect(hhmm(ts, "America/New_York")).toBe("09:30");
    expect(hhmm(ts, TZ_VN)).toBe("20:30");
  });

  it("chuyển sang giờ hè 2026-03-08: 02:00 EST nhảy 03:00 EDT", () => {
    expect(hhmm(Date.parse("2026-03-08T06:59:00Z"), "America/New_York")).toBe("01:59");
    expect(hhmm(Date.parse("2026-03-08T07:00:00Z"), "America/New_York")).toBe("03:00");
  });

  it("về giờ đông 2026-11-01: 01:59 EDT → 01:00 EST", () => {
    expect(hhmm(Date.parse("2026-11-01T05:59:00Z"), "America/New_York")).toBe("01:59");
    expect(hhmm(Date.parse("2026-11-01T06:00:00Z"), "America/New_York")).toBe("01:00");
  });

  it("ngày ET khác ngày VN lúc tối ET", () => {
    const ts = Date.parse("2026-11-20T23:30:00Z"); // 18:30 ET thứ 6, 06:30 VN thứ 7
    expect(etDateOf(ts)).toBe("2026-11-20");
    expect(dateIn(ts, TZ_VN)).toBe("2026-11-21");
  });

  it("etNow trả phút trong ngày và thứ", () => {
    const n = etNow(new Date("2026-11-20T14:29:00Z"));
    expect(n).toMatchObject({ date: "2026-11-20", hh: 9, mm: 29, minutes: 569, dow: 5 });
  });
});

describe("time · ngày, tuần, tháng", () => {
  it("addDays qua tháng / năm", () => {
    expect(addDays("2026-11-30", 1)).toBe("2026-12-01");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
  });

  it("mondayOf: trong tuần về thứ 2, cuối tuần sang tuần kế", () => {
    expect(mondayOf("2026-11-20")).toBe("2026-11-16");
    expect(mondayOf("2026-11-16")).toBe("2026-11-16");
    expect(mondayOf("2026-11-21")).toBe("2026-11-23");
    expect(mondayOf("2026-11-22")).toBe("2026-11-23");
  });

  it("isWeekday", () => {
    expect(isWeekday("2026-11-20")).toBe(true);
    expect(isWeekday("2026-11-21")).toBe(false);
  });

  it("monthRange / shiftMonth", () => {
    expect(monthRange("2026-12")).toEqual({ start: "2026-12-01", next: "2027-01-01", days: 31 });
    expect(monthRange("2028-02").days).toBe(29);
    expect(shiftMonth("2026-01", -1)).toBe("2025-12");
    expect(shiftMonth("2026-11", 2)).toBe("2027-01");
  });

  it("inSession 09:30–11:30 ET", () => {
    expect(inSession(9 * 60 + 29)).toBe(false);
    expect(inSession(9 * 60 + 30)).toBe(true);
    expect(inSession(11 * 60 + 30)).toBe(true);
    expect(inSession(11 * 60 + 31)).toBe(false);
  });
});
