// Đọc trade plan cho dashboard (server). Lập lại plan từ payload bằng plan-core để lấy các level.
import core, { type PlanSummary } from "@/lib/plan-core";
import { db, signedUrl } from "@/lib/db";

export type PlanRow = {
  trade_date: string;
  symbol: string;
  summary: PlanSummary | null;
  plan_text: string | null;
  image_path: string | null;
  payload: Record<string, unknown> | null;
  updated_at: string;
};

export type Level = { name: string; px: number; kind: "comp" | "prth" | "ovn" | "poc" | "hvn" | "target" | "price" };

export type PlanView = PlanRow & { imageUrl: string | null; levels: Level[]; bias: "long" | "short" | "flat" };

export async function getPlan(date: string): Promise<PlanRow | null> {
  const rows = await db.select<PlanRow>(
    "trade_plans",
    `select=trade_date,symbol,summary,plan_text,image_path,payload,updated_at&trade_date=eq.${date}&order=updated_at.desc&limit=1`,
  );
  return rows[0] || null;
}

export async function getLatestPlanBefore(date: string): Promise<PlanRow | null> {
  const rows = await db.select<PlanRow>(
    "trade_plans",
    `select=trade_date,symbol,summary,image_path,updated_at&trade_date=lt.${date}&order=trade_date.desc&limit=1`,
  );
  return rows[0] || null;
}

export function biasTone(bias: string | undefined | null): "long" | "short" | "flat" {
  return bias === "Lên" ? "long" : bias === "Xuống" ? "short" : "flat";
}

export function levelsOf(payload: unknown): Level[] {
  try {
    const p = core.planFromJson(payload);
    if (p.error || !p.D) return [];
    const D = p.D;
    const out: Level[] = [];
    const add = (name: string, px: number | null | undefined, kind: Level["kind"]) => {
      if (px !== null && px !== undefined && Number.isFinite(Number(px))) out.push({ name, px: Number(px), kind });
    };
    if (D.comp) {
      add("Composite VAH", D.comp.vah, "comp");
      add("Composite POC", D.comp.poc, "comp");
      add("Composite VAL", D.comp.val, "comp");
    }
    add("pRTH VAH", D.rvah, "prth");
    add("pRTH POC", D.rpoc, "poc");
    add("pRTH VAL", D.rval, "prth");
    add("OVN High", D.onh, "ovn");
    add("OVN POC", D.opoc, "ovn");
    add("OVN Low", D.onl, "ovn");
    (D.zones || []).forEach((z) => add(`HVN ${core.fmt(z.lo)}–${core.fmt(z.hi)}`, (z.lo + z.hi) / 2, "hvn"));
    add("Target", D.target, "target");
    add("Giá 9:29", D.px, "price");
    return out.sort((a, b) => b.px - a.px);
  } catch {
    return [];
  }
}

export async function planView(row: PlanRow): Promise<PlanView> {
  return {
    ...row,
    imageUrl: row.image_path ? await signedUrl(row.image_path) : null,
    levels: levelsOf(row.payload),
    bias: biasTone(row.summary?.bias),
  };
}

export const fmtPx = (n: number | null | undefined) => core.fmt(n);
