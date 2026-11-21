// Helper API (lib/api.ts) + schema body (lib/schemas.ts). Payload JSON v1 thật phải qua nguyên vẹn, không đổi trường.
import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { crossOrigin, readJson, tokenEquals } from "@/lib/api";
import { JournalPut, journalPutError, PlanPayloadV1, planPayloadError } from "@/lib/schemas";

const sample = JSON.parse(fs.readFileSync(path.resolve(__dirname, "../public/assets/sample_plan_20261112.json"), "utf8"));

const req = (body: string, headers: Record<string, string> = {}) =>
  new Request("https://zendojo-deren.vercel.app/api/plan", { method: "POST", body, headers: { host: "zendojo-deren.vercel.app", ...headers } });

describe("api · tokenEquals", () => {
  it("đúng / sai / rỗng", () => {
    expect(tokenEquals("abc123", "abc123")).toBe(true);
    expect(tokenEquals("abc124", "abc123")).toBe(false);
    expect(tokenEquals("abc", "abc123")).toBe(false);
    expect(tokenEquals("", "abc")).toBe(false);
    expect(tokenEquals("abc", undefined)).toBe(false);
  });
});

describe("api · crossOrigin", () => {
  it("không có Origin (ATAS, curl) → cho qua", () => expect(crossOrigin(req("{}"))).toBeNull());
  it("cùng host → cho qua", () => expect(crossOrigin(req("{}", { origin: "https://zendojo-deren.vercel.app" }))).toBeNull());
  it("khác host → 403 forbidden_origin", async () => {
    const r = crossOrigin(req("{}", { origin: "https://evil.example" }));
    expect(r?.status).toBe(403);
    expect(await r?.json()).toMatchObject({ ok: false, code: "forbidden_origin" });
  });
});

describe("schemas · PlanPayloadV1", () => {
  it("payload 12/11 qua nguyên vẹn (giữ mọi trường)", async () => {
    const r = await readJson(req(JSON.stringify(sample)), PlanPayloadV1, { maxBytes: 2e6, invalid: planPayloadError });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data).toEqual(sample);
  });

  it("giữ trường lạ (indicator thêm trường mới)", () => {
    const r = PlanPayloadV1.safeParse({ ...sample, extra_field: 1, prth: { ...sample.prth, new_x: "y" } });
    expect(r.success && r.data.extra_field === 1 && (r.data.prth as Record<string, unknown>).new_x === "y").toBe(true);
  });

  it("thiếu price vẫn nhận (giống trước: lưu payload, bước vẽ ảnh báo lỗi)", () => {
    const { price: _p, ...rest } = sample;
    expect(PlanPayloadV1.safeParse(rest).success).toBe(true);
  });

  it.each([
    ["JSON hỏng", "{not json"],
    ["thiếu prth", JSON.stringify({ ...sample, prth: undefined })],
    ["date sai dạng", JSON.stringify({ ...sample, date: "12/11/2026" })],
  ])("%s → 400 với thông báo cũ", async (_n, body) => {
    const r = await readJson(req(body), PlanPayloadV1, { maxBytes: 2e6, invalid: planPayloadError });
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.response.status).toBe(400);
      expect(await r.response.json()).toMatchObject({ ok: false, code: "invalid_body", error: "Payload thiếu date (yyyy-MM-dd), prth hoặc ovn" });
    }
  });

  it("sai kiểu số → 400 nêu trường", async () => {
    const r = await readJson(req(JSON.stringify({ ...sample, prth: { ...sample.prth, vah: "28697" } })), PlanPayloadV1, {
      maxBytes: 2e6,
      invalid: planPayloadError,
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect((await r.response.json()).error).toBe("Payload sai kiểu: prth.vah");
  });

  it("body quá lớn → 413", async () => {
    const r = await readJson(req(JSON.stringify(sample), { "content-length": "9999999" }), PlanPayloadV1, { maxBytes: 2e6, invalid: planPayloadError });
    expect(r.ok === false && r.response.status).toBe(413);
  });
});

describe("schemas · JournalPut", () => {
  it("hợp lệ", () => expect(JournalPut.safeParse({ day: { trade_date: "2026-11-20", lesson: "x" }, trades: [{ side: "Long" }] }).success).toBe(true));
  it("thiếu trade_date", () => {
    const r = JournalPut.safeParse({ day: {} });
    expect(r.success).toBe(false);
    if (!r.success) expect(journalPutError(r.error.issues)).toBe("Thiếu day.trade_date (yyyy-MM-dd)");
  });
  it("quá 50 lệnh", () => {
    const r = JournalPut.safeParse({ day: { trade_date: "2026-11-20" }, trades: Array.from({ length: 51 }, () => ({})) });
    expect(r.success).toBe(false);
    if (!r.success) expect(journalPutError(r.error.issues)).toContain("tối đa 50");
  });
});
