// plan-core.js: một engine cho trang Trade Plan, /api/plan và Journal. Không được đổi output khi tối ưu.
// Case 12/11 so với scripts/plan-core.snapshot.json (cùng chuẩn với scripts/check-plan-core.mjs).
// Các biến thể dịch giá 9:29 từ payload 12/11 để phủ nhiều nhánh vị trí / bias; snapshot nằm ở tests/__snapshots__.
import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import core from "@/lib/plan-core";

const repo = path.resolve(__dirname, "../../..");
const SAMPLE = "apps/web/public/assets/sample_plan_20261112.json";
const sample = JSON.parse(fs.readFileSync(path.join(repo, SAMPLE), "utf8"));
const snap = JSON.parse(fs.readFileSync(path.join(repo, "scripts/plan-core.snapshot.json"), "utf8"))[SAMPLE];

const pick = (p: ReturnType<typeof core.planFromJson>) => ({
  summary: p.summary,
  zones: ((p as unknown as { zones?: { lo: number; hi: number }[] }).zones || []).map((z) => ({ lo: z.lo, hi: z.hi })),
  text: p.text,
});

describe("plan-core · payload 12/11", () => {
  const p = core.planFromJson(sample);

  it("không lỗi và ra SVG", () => {
    expect(p.error).toBeUndefined();
    expect(p.svg).toMatch(/^<svg[\s>]/);
  });

  it("khớp snapshot chuẩn (summary, zones, text)", () => {
    const got = pick(p);
    expect(got.summary).toEqual(snap.summary);
    expect(got.zones).toEqual(snap.zones);
    expect(got.text).toBe(snap.text);
  });

  it("chạy lại cho cùng kết quả (hàm thuần)", () => {
    expect(pick(core.planFromJson(structuredClone(sample)))).toEqual(pick(p));
  });
});

describe("plan-core · biến thể giá 9:29 (từ payload 12/11)", () => {
  const cases: [string, number][] = [
    ["trên VA pRTH", 28760],
    ["trong VA pRTH", 28550],
    ["giữa OVN và pRTH", 28360],
    ["trong VA OVN", 28220],
    ["dưới ONL", 27950],
  ];
  for (const [name, price] of cases) {
    it(name, () => {
      const p = core.planFromJson({ ...structuredClone(sample), price });
      expect(p.error).toBeUndefined();
      expect(pick(p)).toMatchSnapshot();
    });
  }

  it("OVN lệch lên trên VA pRTH (dịch OVN + giá 9:29 thêm 600 điểm)", () => {
    const j = structuredClone(sample);
    const up = (v: number) => v + 600;
    for (const k of ["vah", "val", "poc", "onh", "onl"]) j.ovn[k] = up(j.ovn[k]);
    j.ovn.periods_hl = j.ovn.periods_hl.map((hl: number[]) => hl.map(up));
    j.price = up(j.price);
    const p = core.planFromJson(j);
    expect(p.error).toBeUndefined();
    expect(p.summary.bias).not.toBe(core.planFromJson(sample).summary.bias);
    expect(pick(p)).toMatchSnapshot();
  });

  it("không có composite vẫn lập được plan", () => {
    const { composite: _c, ...rest } = structuredClone(sample);
    const p = core.planFromJson(rest);
    expect(p.error).toBeUndefined();
    expect(pick(p)).toMatchSnapshot();
  });
});

describe("plan-core · đầu vào lỗi", () => {
  it.each([
    ["thiếu prth", { ...sample, prth: undefined }],
    ["thiếu ovn", { ...sample, ovn: undefined }],
    ["thiếu price", { ...sample, price: undefined }],
    ["null", null],
  ])("%s → error", (_n, j) => {
    expect(core.planFromJson(j).error).toBeTruthy();
  });
});
