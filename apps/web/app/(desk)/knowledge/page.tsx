import type { Metadata } from "next";
import Link from "next/link";
import { COURSES } from "@/lib/courses";
import { getT } from "@/lib/prefs-server";
import KnowledgeTabs from "./KnowledgeTabs";

export const metadata: Metadata = { title: "Knowledge" };

const FLOW = [
  { n: "01", t: "AMT", s: "Thị trường đang cân bằng hay mất cân bằng", hi: false },
  { n: "02", t: "Context", s: "TPO / VPO: value, POC, HVN / LVN, day type", hi: true },
  { n: "03", t: "Plan", s: "Bias, kịch bản chính, điểm đổi ý", hi: false },
  { n: "04", t: "Entry", s: "Trigger orderflow tại level của plan", hi: true },
  { n: "05", t: "Journal", s: "Recap, R, lỗi, bài học → thống kê", hi: false },
];

export default async function KnowledgePage() {
  const { t } = await getT();
  return (
    <>
      <header className="page-head">
        <div>
          <span className="lbl">Knowledge</span>
          <h1 className="h1">AMT → Context → Entry</h1>
        </div>
        <Link className="btn" href="/knowledge/quiz">{t("Làm quiz ôn tập")}</Link>
      </header>
      <section className="card" aria-label={t("Luồng mỗi ngày")}>
        <span className="lbl">{t("Luồng mỗi ngày")}</span>
        <ol className="flow">
          {FLOW.map((f) => (
            <li key={f.n} className={f.hi ? "hi" : ""}>
              <span className="mono small" style={{ color: f.hi ? "var(--accent)" : "var(--dim)" }}>{f.n}</span>
              <span style={{ fontSize: 14, fontWeight: 600 }}>{f.t}</span>
              <span className="small muted" style={{ lineHeight: 1.45 }}>{t(f.s)}</span>
            </li>
          ))}
        </ol>
      </section>
      <KnowledgeTabs />
      <section className="course-cards" aria-label={t("Khoá học")}>
        {COURSES.map((c) => (
          <Link key={c.key} href={`/knowledge/${c.key}`} className="card course-card">
            <span className="lbl">{t(c.track)} · {t("{n} chương", { n: c.chapters.length })}</span>
            <span className="h3">{t(c.title)}</span>
            <span className="small dim">{t(c.sub)}</span>
          </Link>
        ))}
      </section>
    </>
  );
}
