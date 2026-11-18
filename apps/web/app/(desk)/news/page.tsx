import type { Metadata } from "next";
import Link from "next/link";
import { NEWS_CATEGORIES, getNews, type NewsCategory, type NewsItem } from "@/lib/market";
import { getT } from "@/lib/prefs-server";
import { readArticle } from "@/lib/reader";
import Icon from "../_components/Icon";
import { NewsRow } from "../_components/MarketBits";
import { NotConfigured } from "../_components/States";

export const metadata: Metadata = { title: "News" };
export const dynamic = "force-dynamic";

const LABEL: Record<NewsCategory, string> = { general: "Thị trường", forex: "Forex", merger: "M&A" };
const STEP = 20;
const MAX = 100;

export default async function NewsPage({ searchParams }: { searchParams: Promise<{ cat?: string; id?: string; n?: string }> }) {
  const sp = await searchParams;
  const category = (NEWS_CATEGORIES as readonly string[]).includes(sp.cat || "") ? (sp.cat as NewsCategory) : "general";
  const count = Math.min(MAX, Math.max(STEP, Math.round(Number(sp.n) / STEP) * STEP || STEP));
  const { t } = await getT();
  // Lấy đủ MAX một lần (cùng một lệnh Finnhub, đã cache 5 phút), chỉ hiện `count` bài
  const res = await getNews(category, MAX);
  const shown = res.items.slice(0, count);
  const now = Date.now();
  const q = (o: Record<string, string | number | undefined>) => {
    const p = new URLSearchParams();
    p.set("cat", category);
    for (const [k, v] of Object.entries(o)) if (v !== undefined && v !== "") p.set(k, String(v));
    return `/news?${p.toString()}`;
  };
  const nParam = count > STEP ? count : undefined;
  // Chỉ đọc bài có trong danh sách vừa tải (không nhận URL tuỳ ý)
  const sel: NewsItem | undefined = sp.id ? res.items.find((n) => n.id === sp.id) : undefined;
  const article = sel ? await readArticle(sel.url) : null;

  return (
    <>
      <header className="page-head">
        <div>
          <span className="lbl">{t("Tổng quan")}</span>
          <h1 className="h1">News</h1>
        </div>
        <nav className="seg" aria-label={t("Chủ đề tin")}>
          {NEWS_CATEGORIES.map((c) => (
            <Link key={c} href={`/news?cat=${c}`} aria-current={c === category ? "page" : undefined} className={"seg-link" + (c === category ? " on" : "")}>
              {t(LABEL[c])}
            </Link>
          ))}
        </nav>
      </header>
      {!res.configured ? (
        <NotConfigured what="News" />
      ) : !res.ok ? (
        <div className="notice">{t("Không tải được tin")}: {res.error}</div>
      ) : !res.items.length ? (
        <p className="small dim">{t("Chưa có tin.")}</p>
      ) : (
        <div className={"news-split" + (sp.id ? " reading" : "")}>
          <section className="card news-list tight" aria-label={t("Danh sách tin")}>
            {shown.map((n) => <NewsRow key={n.id} n={n} now={now} href={q({ id: n.id, n: nParam })} active={n.id === sp.id} />)}
            {res.items.length > count && (
              <Link className="btn sm" style={{ alignSelf: "center", marginTop: 8 }} href={q({ n: count + STEP, id: sp.id })} scroll={false}>
                {t("Tải thêm {n} bài", { n: Math.min(STEP, res.items.length - count) })}
              </Link>
            )}
          </section>

          <article className="card reader" aria-label={t("Đọc tin")}>
            {!sp.id ? (
              <div className="reader-empty">
                <Icon name="news" size={28} />
                <p className="small dim">{t("Chọn một tin bên trái để đọc ngay trong Deren Desk.")}</p>
              </div>
            ) : !sel ? (
              <div className="reader-empty">
                <p className="small dim">{t("Tin này không còn trong danh sách mới nhất của Finnhub.")}</p>
                <Link className="btn sm" href={q({ n: nParam })}>{t("Đóng")}</Link>
              </div>
            ) : (
              <>
                <div className="row reader-bar">
                  <Link className="btn sm" href={q({ n: nParam })} scroll={false}>‹ {t("Danh sách")}</Link>
                  <a className="btn sm" href={sel.url} target="_blank" rel="noreferrer noopener"><Icon name="external" size={14} /> {t("Mở bài gốc")}</a>
                </div>
                <header className="reader-head">
                  <span className="news-meta">
                    <span>{article?.ok && article.site ? article.site : sel.source}</span>
                    {article?.ok && article.byline && <span>· {article.byline}</span>}
                    {article?.ok && <span className="dim">· {t("{n} phút đọc", { n: Math.max(1, Math.round(article.words / 220)) })}</span>}
                  </span>
                  <h2 className="reader-title">{sel.headline}</h2>
                </header>
                {article?.ok ? (
                  <div className="prose" dangerouslySetInnerHTML={{ __html: article.html }} />
                ) : (
                  <>
                    {sel.summary && <p className="reader-summary">{sel.summary}</p>}
                    <div className="notice small">
                      {t("Không đọc được toàn văn trong app")}: {article ? t(article.error) : ""}. {t("Bấm “Mở bài gốc” để đọc trên trang nguồn.")}
                    </div>
                  </>
                )}
              </>
            )}
          </article>
        </div>
      )}
      <span className="small faint">{t("Nguồn: Finnhub, cập nhật khoảng 5 phút một lần, không lưu database. Bài đọc trong app được tách từ trang gốc, chỉ dùng xem cá nhân.")}</span>
    </>
  );
}
