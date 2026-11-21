// Khoá học cũ (trang tĩnh trong public/) hiển thị trong Knowledge qua iframe chế độ nhúng (D45).
// Danh sách chương khớp NAV trong public/assets/js/core.js — đổi chương ở đó thì sửa cả ở đây.
export type Course = { key: string; file: string; title: string; sub: string; track: "Context" | "Entry" | "Ôn tập"; chapters: [string, string, string][] };

export const COURSES: Course[] = [
  {
    key: "levels",
    file: "levels",
    title: "TPO Level",
    sub: "TPO · VWAP · EMA · CVD",
    track: "Context",
    chapters: [
      ["tong-quan", "00", "Tổng quan"],
      ["nen-tang", "01", "Nền tảng TPO"],
      ["cau-truc", "02", "Day & Open types"],
      ["initial-balance", "03", "Initial Balance"],
      ["levels", "04", "Level map"],
      ["vwap", "05", "VWAP RTH"],
      ["ema", "06", "EMA 9/34"],
      ["cvd", "07", "CVD divergence"],
      ["plan", "08", "Lên plan mỗi ngày"],
    ],
  },
  {
    key: "plan",
    file: "plan",
    title: "Trade Plan · khung",
    sub: "Composite × pRTH × OVN",
    track: "Context",
    chapters: [
      ["khung", "00", "Khung plan"],
      ["hvn", "01", "Xác định HVN"],
      ["bias", "02", "Đọc bias"],
      ["vwap", "03", "VWAP RTH"],
      ["builder", "04", "Plan Builder"],
      ["quy-trinh", "05", "Quy trình trade"],
      ["quiz", "06", "Quiz"],
    ],
  },
  {
    key: "tools",
    file: "tools",
    title: "Orderflow Tools",
    sub: "DOM · Tape · Footprint · Delta",
    track: "Entry",
    chapters: [
      ["tong-quan", "00", "Tổng quan"],
      ["nen-tang", "01", "Nền tảng"],
      ["thuat-ngu", "02", "Thuật ngữ"],
      ["footprint", "03", "Footprint"],
      ["delta", "04", "Delta & CVD"],
      ["dom", "05", "DOM"],
      ["tape", "06", "Tape"],
      ["kich-ban", "07", "13 kịch bản"],
      ["ket-hop", "08", "Kết hợp tại level"],
    ],
  },
  {
    key: "quiz",
    file: "quiz",
    title: "Trắc nghiệm",
    sub: "Luyện tập · Thi thử · Ôn câu sai",
    track: "Ôn tập",
    chapters: [
      ["luyen-tap", "A", "Luyện tập"],
      ["thi-thu", "B", "Thi thử"],
      ["cau-sai", "C", "Ôn câu sai"],
    ],
  },
];

export const courseOf = (k: string) => COURSES.find((c) => c.key === k);
