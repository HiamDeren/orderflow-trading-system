// Schema zod cho body API. Nguyên tắc: chỉ chặn thứ chắc chắn sai (sai kiểu cấu trúc), không đổi tên trường,
// giữ mọi trường lạ (.loose) vì payload được lưu nguyên vào trade_plans.payload và indicator có thể thêm trường mới.
import { z } from "zod";
import { DATE_RE } from "@/lib/time";

// Số giá / VA từ indicator: number, có thể null nếu indicator không tính được.
const px = z.number().nullable().optional();
const count = z.number().optional();
// periods_hl: [[high, low], ...] từng period 30'
const periodsHl = z.array(z.array(z.number().nullable())).optional();

// JSON v1 từ indicator "Deren · Plan Sender" (docs/plan-sender, claude/04-du-lieu-api.md). Tên trường cố định.
export const PlanPayloadV1 = z.looseObject({
  v: z.number().optional(),
  source: z.string().optional(),
  trigger: z.string().optional(),
  symbol: z.string().optional(),
  date: z.string().regex(DATE_RE),
  ts_et: z.string().optional(),
  price: px,
  tick: px,
  row: px,
  prth: z.looseObject({
    date: z.string().optional(),
    vah: px,
    val: px,
    poc: px,
    high: px,
    low: px,
    close: px,
    periods: count,
    periods_hl: periodsHl,
  }),
  ovn: z.looseObject({
    vah: px,
    val: px,
    poc: px,
    onh: px,
    onl: px,
    periods: count,
    periods_hl: periodsHl,
  }),
  sessions: z.array(z.looseObject({ date: z.string().optional(), type: z.string().optional(), val: px, vah: px, poc: px, periods: count })).optional(),
  composite: z.looseObject({ days: count, row: px, vah: px, val: px, poc: px }).nullable().optional(),
  warnings: z.array(z.unknown()).optional(),
  notify: z.boolean().optional(),
});
export type PlanPayload = z.infer<typeof PlanPayloadV1>;

// Thông báo 400 cũ khi thiếu trường bắt buộc (Plan Builder / Trade Plan hiện chuỗi này); sai kiểu thì nói rõ trường.
export function planPayloadError(issues: z.core.$ZodIssue[]) {
  const missing = issues.some((i) => i.path.length <= 1 && ["date", "prth", "ovn"].includes(String(i.path[0] ?? "")));
  const root = issues.some((i) => i.path.length === 0);
  if (missing || root) return "Payload thiếu date (yyyy-MM-dd), prth hoặc ovn";
  return `Payload sai kiểu: ${issues
    .slice(0, 3)
    .map((i) => i.path.join("."))
    .join(", ")}`;
}

// PUT /api/journal: lib/journal.ts (normDay / normTrade) tự lọc giá trị; ở đây chỉ kiểm khung + giới hạn số lệnh.
export const MAX_TRADES = 50;
export const JournalPut = z.object({
  day: z.looseObject({ trade_date: z.string().regex(DATE_RE) }),
  trades: z.array(z.looseObject({})).max(MAX_TRADES).optional(),
});
export function journalPutError(issues: z.core.$ZodIssue[]) {
  if (issues.some((i) => i.path[0] === "trades")) return `trades phải là danh sách, tối đa ${MAX_TRADES} lệnh`;
  return "Thiếu day.trade_date (yyyy-MM-dd)";
}

// PATCH /api/journal/image
export const JournalImagePatch = z.looseObject({
  id: z.string(),
  caption: z.unknown().optional(),
  trade_seq: z.unknown().optional(),
});

// POST /api/members
export const MemberPost = z.object({
  action: z.string().optional(),
  discord_id: z.unknown().optional(),
  note: z.unknown().optional(),
});
