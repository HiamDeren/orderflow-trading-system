// Cầu nối tạm tới engine plan dùng chung với trang tĩnh (public/assets/js/plan-core.js, dạng UMD).
// Giai đoạn sau: port sang packages/plan-core (TypeScript) và bỏ file này.
import coreJs from "../public/assets/js/plan-core.js";

export type PlanSummary = {
  date: string; location: string; prth: string; ovn: string; bias: string; conf: string;
  setup: string; target: number | null; distance: number | null; flip: string; price: number;
  zone: { lo: number; hi: number } | null;
};
export type PlanLevels = {
  zones: { lo: number; hi: number }[]; px: number;
  rvah: number; rval: number; rpoc: number | null; rhi: number | null; rlo: number | null;
  ovah: number; oval: number; opoc: number | null; onh: number | null; onl: number | null;
  target: number | null; comp: { vah: number; val: number; poc: number } | null;
};
export type PlanPanelRow = { k: string; v: string; c?: string };
export type Plan = { error?: string; svg: string; text: string; summary: PlanSummary; D: PlanLevels; panel: PlanPanelRow[] };

type PlanCore = {
  planFromJson(payload: unknown): Plan;
  fmt(n: number | null | undefined): string;
  lc1(s: string): string;
};

const core = coreJs as PlanCore;
export default core;
