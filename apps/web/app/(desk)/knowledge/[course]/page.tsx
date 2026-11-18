import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { COURSES, courseOf } from "@/lib/courses";
import { getT, getUi } from "@/lib/prefs-server";
import CourseFrame from "./CourseFrame";

export async function generateMetadata({ params }: { params: Promise<{ course: string }> }): Promise<Metadata> {
  return { title: courseOf((await params).course)?.title || "Knowledge" };
}

export default async function CoursePage({ params }: { params: Promise<{ course: string }> }) {
  const c = courseOf((await params).course);
  if (!c) notFound();
  const { t } = await getT();
  const ui = await getUi();
  return (
    <>
      <header className="page-head">
        <div>
          <span className="lbl"><Link href="/knowledge">Knowledge</Link> · {t(c.track)}</span>
          <h1 className="h1">{t(c.title)}</h1>
        </div>
        <nav className="seg" aria-label={t("Khoá học")}>
          {COURSES.map((x) => (
            <Link key={x.key} href={`/knowledge/${x.key}`} className={"seg-link" + (x.key === c.key ? " on" : "")} aria-current={x.key === c.key ? "page" : undefined}>
              {t(x.title)}
            </Link>
          ))}
        </nav>
      </header>
      <CourseFrame key={c.key + ui.lang} course={c} src={`/${c.file}${ui.lang === "en" ? ".en" : ""}`} />
    </>
  );
}
