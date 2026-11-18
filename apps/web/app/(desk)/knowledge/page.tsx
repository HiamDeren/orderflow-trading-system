import type { Metadata } from "next";
import KnowledgeTabs from "./KnowledgeTabs";

export const metadata: Metadata = { title: "Knowledge" };

const FLOW = [
  { n: "01", t: "AMT", s: "Thị trường đang cân bằng hay mất cân bằng", hi: false },
  { n: "02", t: "Context", s: "TPO / VPO: value, POC, HVN / LVN, day type", hi: true },
  { n: "03", t: "Plan", s: "Bias, kịch bản chính, điểm đổi ý", hi: false },
  { n: "04", t: "Entry", s: "Trigger orderflow tại level của plan", hi: true },
  { n: "05", t: "Journal", s: "Recap, R, lỗi, bài học → thống kê", hi: false },
];

export default function KnowledgePage() {
  return (
    <>
      <header className="page-head">
        <div>
          <span className="lbl">Knowledge</span>
          <h1 className="h1">AMT → Context → Entry</h1>
        </div>
        <a className="small" href="/quiz" style={{ fontWeight: 600 }}>Làm quiz ôn tập</a>
      </header>
      <section className="card" aria-label="Luồng mỗi ngày">
        <span className="lbl">Luồng mỗi ngày</span>
        <ol className="flow">
          {FLOW.map((f) => (
            <li key={f.n} className={f.hi ? "hi" : ""}>
              <span className="mono small" style={{ color: f.hi ? "var(--accent)" : "var(--dim)" }}>{f.n}</span>
              <span style={{ fontSize: 14, fontWeight: 600 }}>{f.t}</span>
              <span className="small muted" style={{ lineHeight: 1.45 }}>{f.s}</span>
            </li>
          ))}
        </ol>
      </section>
      <KnowledgeTabs />
    </>
  );
}
