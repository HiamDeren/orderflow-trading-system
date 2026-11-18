"use client";
// Khoá học cũ trong khung Deren Desk: mục lục chương bên trái, trang học (iframe chế độ nhúng) bên phải.
// Trang con báo chiều cao + chương qua postMessage (public/assets/js/core.js, embedBridge) nên iframe cao theo nội dung, cuộn chung với trang.
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { COURSES, type Course } from "@/lib/courses";
import { useUi } from "../../_components/Ui";

type Msg = { type: string; h?: number; slug?: string; top?: boolean; path?: string; hash?: string };

export default function CourseFrame({ course, src }: { course: Course; src: string }) {
  const { t } = useUi();
  const router = useRouter();
  const frame = useRef<HTMLIFrameElement>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [h, setH] = useState(900);
  const [slug, setSlug] = useState(course.chapters[0][0]);

  useEffect(() => {
    const hash = decodeURIComponent(location.hash.slice(1));
    if (hash) setSlug(hash);
    setUrl(`${src}?embed=1${hash ? "#" + encodeURIComponent(hash) : ""}`);
  }, [src]);

  useEffect(() => {
    const onMsg = (e: MessageEvent<Msg>) => {
      if (e.origin !== location.origin || e.source !== frame.current?.contentWindow || !e.data) return;
      const d = e.data;
      if (d.type === "ofs:h" && d.h) setH(Math.max(400, d.h));
      if (d.type === "ofs:chapter" && d.slug) {
        setSlug(d.slug);
        history.replaceState(null, "", `#${d.slug}`);
        if (d.top) frame.current?.closest(".course")?.scrollIntoView({ block: "start" });
      }
      if (d.type === "ofs:nav" && d.path) {
        const page = d.path.replace(/^\//, "").replace(/\.html$/, "").replace(/\.en$/, "");
        const target = COURSES.find((c) => c.file === page);
        router.push(target ? `/knowledge/${target.key}${d.hash || ""}` : page === "index" || page === "learn" ? "/knowledge" : "/knowledge");
      }
    };
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, [router]);

  const go = (s: string) => {
    setSlug(s);
    history.replaceState(null, "", `#${s}`);
    frame.current?.contentWindow?.postMessage({ type: "ofs:go", hash: s }, location.origin);
    frame.current?.closest(".course")?.scrollIntoView({ block: "start" });
  };

  return (
    <div className="course">
      <nav className="card tight course-toc" aria-label={t("Chương")}>
        <span className="lbl" style={{ padding: "6px 8px" }}>{t(course.sub)}</span>
        <ol>
          {course.chapters.map(([s, n, title]) => (
            <li key={s}>
              <a
                href={`#${s}`}
                className={s === slug ? "on" : ""}
                aria-current={s === slug ? "true" : undefined}
                onClick={(e) => {
                  e.preventDefault();
                  go(s);
                }}
              >
                <span className="mono">{n}</span>
                <span>{t(title)}</span>
              </a>
            </li>
          ))}
        </ol>
      </nav>
      <div className="course-body">
        {url ? (
          <iframe ref={frame} src={url} title={t(course.title)} style={{ height: h }} />
        ) : (
          <div className="card" style={{ minHeight: 400 }} />
        )}
      </div>
    </div>
  );
}
