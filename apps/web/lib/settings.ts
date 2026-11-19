// Thiết lập giao dịch cố định (hiện ở trang Profile). Đổi ở đây, không lưu database.
export const SETTINGS = {
  symbol: "NQ",

  maxTradesPerDay: 3,
  planSend: "09:29 ET · 21:29 VN",
  displayTz: "ET + VN",
  language: "Tiếng Việt",
};

// Lựa chọn trong journal (khớp check constraint trong migration journal).
export const DAY_TYPES = ["Normal day", "Normal variation", "Neutral day", "Neutral extreme day", "Double distribution day", "Trending day", "IDK"] as const;
export const RESULTS = ["Win", "Loss", "Breakeven", "No Trade"] as const;
export const OPEN_TYPES = ["Open drive", "Open test drive", "Open rejection reverse", "Open auction"] as const;
export const BIAS_CHECK = ["Đúng", "Sai", "Một phần"] as const;
export const FOLLOWED = ["Có", "Một phần", "Không"] as const;
export const SIDES = ["Long", "Short"] as const;
