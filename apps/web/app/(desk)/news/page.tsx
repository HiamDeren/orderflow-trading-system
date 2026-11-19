import type { Metadata } from "next";
import Link from "next/link";
import { NEWS_CATEGORIES, getCompanyNews, getNews, type NewsCategory, type NewsItem } from "@/lib/market";
import { SYMBOL_RE } from "@/lib/stock";
import { getT } from "@/lib/prefs-server";
import { readArticle } from "@/lib/reader";
import Icon from "../_components/Icon";
import { NewsRow } from "../_components/MarketBits";
import { NotConfigured } from "../_components/States";

export const metadata: Metadata = { title: "News" };
export const dynamic = "force-dynamic";

const LABEL: Record<NewsCategory, string> = { general: "Thị trường", forex: "Forex", merger: "M&A" };
const STEP = 20;
const WATCH = ["NVDA", "MSFT", "AAPL", "AMZN", "META", "AVGO", "GOOGL", "TSLA"];
const MAX = 100;

export default async function NewsPage({ searchParams }: { searchParams: Promise<{ cat?: string; id?: string; n?: string; sym?: string }> }) {
  const sp = await searchParams;
  const sym = sp.sym && SYMBOL_RE.test(sp.sym.toUpperCase()) ? sp.sym.toUpperCase() : "";
  const category = (NEWS_CATEGORIES as readonly string[]).includes(sp.cat || "") ? (sp.cat as NewsCategory) : "general";
  const count = Math.min(MAX, Math.max(STEP, Math.round(Number(sp.n) / STEP) * STEP || STEP));
  const { t } = await getT();
  // Lấy đủ MAX một lần (cùng một lệnh Finnhub, đã cache 5 phút), chỉ hiện `count` bài
  const res = sym ? await getCompanyNews(sym, 14, MAX) : await getNews(category, MAX);
  const shown = res.items.slice(0, count);
  const now = Date.now();
  const q = (o: Record<string, string | number | undefined>) => {
    const p = new URLSearchParams();
    if (sym) p.set("sym", sym);
    else p.set("cat", category);
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
          <span className="lbl">{t("Thị trường")}</span>
          <h1 className="h1">News</h1>
        </div>
        {sym && <Link className="btn sm" href={`/stock/${sym}`}>{t("Trang {s}", { s: sym })} ›</Link>}
      </header>
      {!res.configured ? (
        <NotConfigured what="News" />
      ) : !res.ok ? (
        <div className="notice">{t("Không tải được tin")}: {res.error}</div>
      ) : !res.items.length ? (
        <p className="small dim">{t("Chưa có tin.")}</p>
      ) : (
        <div className={"news-split fit" + (sp.id ? " reading" : "")}>
          <aside className="news-filter" aria-label={t("Bộ lọc tin")}>
            <span className="lbl">{t("Chủ đề")}</span>
            {NEWS_CATEGORIES.map((c) => (
              <Link key={c} href={`/news?cat=${c}`} className={"nf-link" + (!sym && c === category ? " on" : "")} aria-current={!sym && c === category ? "page" : undefined}>{t(LABEL[c])}</Link>
            ))}
            <span className="lbl" style={{ marginTop: 14 }}>{t("Theo mã")}</span>
            <div className="chips">
              {WATCH.map((x) => (
                <Link key={x} href={`/news?sym=${x}`} className={"chip mono" + (sym === x ? " on" : "")} aria-current={sym === x ? "page" : undefined}>{x}</Link>
              ))}
            </div>
          </aside>
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
                <p className="small dim">{t("Tin này không còn trong danh sách mới nhất.")}</p>
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
                  {sel.related && (
                    <div className="chips">
                      {sel.related.split(",").map((x) => x.trim().toUpperCase()).filter((x) => /^[A-Z][A-Z0-9.\-]{0,9}$/.test(x)).slice(0, 6).map((x) => (
                        <Link key={x} href={`/stock/${x}`} className="chip mono sm-chip">{x} ↗</Link>
                      ))}
                    </div>
                  )}
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
    </>
  );
}
