import type { Metadata } from "next";
import Link from "next/link";
import { NEWS_CATEGORIES, getNews, type NewsCategory } from "@/lib/market";
import { getT } from "@/lib/prefs-server";
import { NewsRow } from "../_components/MarketBits";
import { NotConfigured } from "../_components/States";

export const metadata: Metadata = { title: "News" };
export const dynamic = "force-dynamic";

const LABEL: Record<NewsCategory, string> = { general: "Thị trường", forex: "Forex", merger: "M&A" };

export default async function NewsPage({ searchParams }: { searchParams: Promise<{ cat?: string }> }) {
  const { cat } = await searchParams;
  const category = (NEWS_CATEGORIES as readonly string[]).includes(cat || "") ? (cat as NewsCategory) : "general";
  const { t } = await getT();
  const res = await getNews(category, 80);
  const now = Date.now();
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
      ) : res.items.length ? (
        <section className="card news-list" aria-label="News">
          {res.items.map((n) => <NewsRow key={n.id} n={n} now={now} />)}
        </section>
      ) : (
        <p className="small dim">{t("Chưa có tin.")}</p>
      )}
      <span className="small faint">{t("Nguồn: Finnhub, cập nhật khoảng 5 phút một lần, không lưu database.")}</span>
    </>
  );
}
