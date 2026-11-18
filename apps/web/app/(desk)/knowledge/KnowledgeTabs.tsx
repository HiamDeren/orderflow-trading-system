"use client";
import Link from "next/link";
import { useState } from "react";
import { useUi } from "../_components/Ui";

type Lesson = { t: string; s: string; href?: string };
type Track = { short: string; part: string; title: string; desc: string; color: string; lessons: Lesson[]; more?: { label: string; href: string } };

// Mỗi bài trỏ vào chương của khoá học cũ (nhúng trong /knowledge/<khoá>). Không dùng khái niệm ICT.
const K = (c: string, s: string) => `/knowledge/${c}#${s}`;
const TRACKS: Track[] = [
  {
    short: "AMT", part: "Phần 1", title: "AMT · Auction Market Theory", color: "var(--muted)",
    desc: "Nền tảng: giá đi tìm nơi giao dịch hiệu quả, value hình thành ra sao.",
    lessons: [
      { t: "Auction & value", s: "Giá quảng bá, thời gian xác nhận", href: K("levels", "nen-tang") },
      { t: "Balance / imbalance", s: "Giằng co trong value và lúc thoát ra", href: K("levels", "cau-truc") },
      { t: "Initiative vs responsive", s: "Ai đang chủ động ở rìa value", href: K("levels", "initial-balance") },
      { t: "Excess & poor high / low", s: "Dấu hiệu auction đã xong hay chưa", href: K("levels", "nen-tang") },
      { t: "Khung thời gian tham gia", s: "Day timeframe và other timeframe", href: K("levels", "initial-balance") },
    ],
    more: { label: "Mở khoá TPO Level", href: "/knowledge/levels" },
  },
  {
    short: "Context · TPO / VPO", part: "Phần 2", title: "Context · TPO / VPO", color: "var(--accent)",
    desc: "Đọc profile để ra level và bối cảnh, từ đó lập trade plan.",
    lessons: [
      { t: "TPO profile", s: "Period, IB, range extension, single prints", href: K("levels", "nen-tang") },
      { t: "Open type & day type", s: "Drive, test, rejection, auction · normal tới trend", href: K("levels", "cau-truc") },
      { t: "Initial Balance", s: "IB hẹp / rộng, mở rộng range", href: K("levels", "initial-balance") },
      { t: "Level map", s: "POC, VAH / VAL, HVN / LVN, single prints", href: K("levels", "levels") },
      { t: "Composite × pRTH × OVN", s: "Giá mở so với value nhiều khung", href: K("plan", "khung") },
      { t: "Xác định HVN", s: "HVN composite làm vùng cản chính", href: K("plan", "hvn") },
      { t: "Đọc bias", s: "Vị trí giá so với value → bias ngày", href: K("plan", "bias") },
      { t: "Từ context ra plan", s: "Bias, kịch bản, điểm đổi ý, mục tiêu", href: K("levels", "plan") },
    ],
    more: { label: "Mở khoá Trade Plan", href: "/knowledge/plan" },
  },
  {
    short: "Entry · Orderflow", part: "Phần 3", title: "Entry · Orderflow tools", color: "var(--long)",
    desc: "Trigger vào lệnh khi giá tới level của plan.",
    lessons: [
      { t: "VWAP RTH", s: "Cổng hướng trong phiên", href: K("levels", "vwap") },
      { t: "EMA 9 / 34", s: "Nhịp kéo về và xu hướng ngắn", href: K("levels", "ema") },
      { t: "CVD", s: "Phân kỳ và xác nhận lực mua bán", href: K("levels", "cvd") },
      { t: "Footprint", s: "Absorption, imbalance, delta tại level", href: K("tools", "footprint") },
      { t: "Delta & CVD", s: "Đọc delta từng nến và cộng dồn", href: K("tools", "delta") },
      { t: "DOM", s: "Lệnh chờ lớn, kéo / rút lệnh", href: K("tools", "dom") },
      { t: "Tape", s: "Tốc độ khớp và lệnh lớn", href: K("tools", "tape") },
      { t: "13 kịch bản", s: "Mẫu orderflow hay gặp tại level", href: K("tools", "kich-ban") },
      { t: "Kết hợp tại level", s: "Ghép context + orderflow thành trigger", href: K("tools", "ket-hop") },
    ],
    more: { label: "Mở khoá Orderflow Tools", href: "/knowledge/tools" },
  },
];

export default function KnowledgeTabs() {
  const { t } = useUi();
  const [tab, setTab] = useState(1);
  const cur = TRACKS[tab];
  return (
    <div className="stack" style={{ gap: 16 }}>
      <div className="seg" role="tablist" aria-label={t("Phần kiến thức")} style={{ alignSelf: "flex-start", padding: 4 }}>
        {TRACKS.map((x, i) => (
          <button key={x.short} role="tab" aria-selected={i === tab} onClick={() => setTab(i)} style={{ minHeight: 40, padding: "0 16px" }}>
            <span className="mono" style={{ fontSize: 11, marginRight: 8, color: i === tab ? x.color : "var(--faint)" }}>0{i + 1}</span>
            {x.short}
          </button>
        ))}
      </div>
      <section className="card" role="tabpanel" aria-label={cur.title} style={{ padding: 22, gap: 16 }}>
        <div className="row wrap" style={{ alignItems: "flex-end", paddingBottom: 14, borderBottom: "1px solid var(--line)" }}>
          <div className="stack" style={{ gap: 6, maxWidth: 640 }}>
            <span className="lbl" style={{ color: cur.color }}>{t(cur.part)}</span>
            <h2 className="h2" style={{ fontSize: 22 }}>{cur.title}</h2>
            <p className="muted" style={{ fontSize: 14 }}>{t(cur.desc)}</p>
          </div>
          {cur.more && <Link className="btn sm" href={cur.more.href}>{t(cur.more.label)} ›</Link>}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "6px 16px" }}>
          {cur.lessons.map((l, i) =>
            l.href ? (
              <Link key={l.t} className="lesson" href={l.href}>
                <span className="num" aria-hidden="true">{i + 1}</span>
                <span style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2 }}><span style={{ fontSize: 14, fontWeight: 500 }}>{t(l.t)}</span><span className="small dim">{t(l.s)}</span></span>
              </Link>
            ) : (
              <div key={l.t} className="lesson">
                <span className="num" aria-hidden="true">{i + 1}</span>
                <span style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2 }}><span style={{ fontSize: 14, fontWeight: 500 }}>{t(l.t)}</span><span className="small dim">{t(l.s)}</span></span>
              </div>
            ),
          )}
        </div>
      </section>
    </div>
  );
}
