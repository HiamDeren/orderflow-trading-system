// Icon nét (stroke) tự vẽ, 20px, theo màu chữ.
const P: Record<string, string[]> = {
  dashboard: ["M3 3h7v9H3z", "M14 3h7v5h-7z", "M14 12h7v9h-7z", "M3 16h7v5H3z"],
  calendar: ["M3 5h18v16H3z", "M3 10h18", "M8 3v4", "M16 3v4"],
  news: ["M4 4h13v16H6a2 2 0 0 1-2-2z", "M17 8h3v10a2 2 0 0 1-2 2", "M8 8h5", "M8 12h5", "M8 16h3"],
  earnings: ["M4 20V10", "M10 20V4", "M16 20v-7", "M22 20H2"],
  plan: ["M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z", "M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8z", "M12 12h.01"],
  journal: ["M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3z", "M5 17a3 3 0 0 1 3-3h11", "M9 8h6"],
  knowledge: ["M2 9l10-5 10 5-10 5z", "M6 11v5c0 1.5 2.7 3 6 3s6-1.5 6-3v-5", "M22 9v6"],
  options: ["M12 3l9 5-9 5-9-5z", "M3 13l9 5 9-5", "M3 17l9 5 9-5"],
  pin: ["M9 4h6l-1 6 4 4H6l4-4z", "M12 14v7"],
  unpin: ["M9 4h6l-1 6 4 4H6l4-4z", "M12 14v7", "M3 3l18 18"],
  menu: ["M3 6h18", "M3 12h18", "M3 18h18"],
  close: ["M6 6l12 12", "M18 6L6 18"],
  copy: ["M9 9h11v11H9z", "M5 15H4V4h11v1"],
  check: ["M5 12l5 5 9-10"],
  logout: ["M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4", "M10 17l5-5-5-5", "M15 12H3"],
  external: ["M14 4h6v6", "M20 4l-9 9", "M18 14v6H4V6h6"],
};

export default function Icon({ name, size = 20 }: { name: string; size?: number }) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ flex: "none" }}>
      {(P[name] || []).map((d, i) => <path key={i} d={d} />)}
    </svg>
  );
}
