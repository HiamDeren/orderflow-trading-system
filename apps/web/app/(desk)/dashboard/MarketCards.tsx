// Card Dashboard lấy dữ liệu Finnhub (watchlist, earnings tuần, news). Mỗi card là async server component riêng,
// page bọc bằng <Suspense> nên plan / lịch tin / journal (Supabase, đã cache) hiện trước, card thị trường tới sau.
// Hai card cùng gọi getEarnings(mon, fri) → fetch cùng URL được Next gộp trong một request.
import Link from "next/link";
import { DOW_SHORT } from "@/lib/i18n";
import { getEarnings, getNews, marketConfigured, NQ_WATCH } from "@/lib/market";
import { getT } from "@/lib/prefs-server";
import { getQuotes } from "@/lib/stock";
import { addDays, dowOf, viDayMonth } from "@/lib/time";
import { NewsRow } from "../_components/MarketBits";

const WATCH = ["NVDA", "MSFT", "AAPL", "AMZN", "META", "AVGO", "GOOGL", "TSLA"];

export async function WatchlistCard({ today, mon }: { today: string; mon: string }) {
  const { t } = await getT();
  const [quotes, earn] = await Promise.all([getQuotes(WATCH), getEarnings(mon, addDays(mon, 4))]);
  const nqEarn = earn.items.filter((e) => NQ_WATCH.includes(e.symbol));
  return (
    <section className="card" aria-label={t("Watchlist · NQ top")}>
      <div className="row">
        <span className="lbl">{t("Watchlist · NQ top")}</span>
        <Link href="/markets" className="small" style={{ fontWeight: 600 }}>
          Markets
        </Link>
      </div>
      {!marketConfigured() ? (
        <p className="small dim">{t("Chưa có FINNHUB_API_KEY trên Vercel.")}</p>
      ) : quotes.length ? (
        <div className="watch">
          {quotes.map((q) => {
            const e = nqEarn.find((x) => x.symbol === q.symbol && x.date >= today);
            return (
              <Link key={q.symbol} href={`/stock/${q.symbol}`} className="watch-row">
                <span className="mono" style={{ fontWeight: 600 }}>
                  {q.symbol}
                </span>
                <span className="small dim watch-note">{e ? t("Earnings {d}", { d: viDayMonth(e.date) }) : ""}</span>
                <span className="mono">{q.c.toFixed(2)}</span>
                <span className={"mono small " + (q.dp === null ? "dim" : q.dp >= 0 ? "long" : "short")}>
                  {q.dp === null ? "—" : (q.dp >= 0 ? "+" : "") + q.dp.toFixed(2) + "%"}
                </span>
              </Link>
            );
          })}
          {quotes.length < WATCH.length && (
            <span className="small dim">{t("Thiếu {n} mã (nguồn giới hạn tần suất), tải lại sau ít phút.", { n: WATCH.length - quotes.length })}</span>
          )}
        </div>
      ) : (
        <p className="small dim">{t("Chưa lấy được giá.")}</p>
      )}
    </section>
  );
}

export async function EarningsWeekCard({ today, mon }: { today: string; mon: string }) {
  const { t, ui } = await getT();
  const earn = await getEarnings(mon, addDays(mon, 4));
  const nqEarn = earn.items.filter((e) => NQ_WATCH.includes(e.symbol));
  return (
    <section className="card" aria-label={t("Earnings tuần này · NQ top")}>
      <div className="row">
        <span className="lbl">{t("Earnings tuần này · NQ top")}</span>
        <Link href="/earnings" className="small" style={{ fontWeight: 600 }}>
          {t("Lịch")}
        </Link>
      </div>
      {!earn.ok ? (
        <p className="small dim">{earn.configured ? earn.error : t("Chưa có FINNHUB_API_KEY trên Vercel.")}</p>
      ) : (
        <div className="ewk">
          {[0, 1, 2, 3, 4]
            .map((i) => addDays(mon, i))
            .map((d) => (
              <div key={d} className={"ewk-d" + (d === today ? " today" : "")}>
                <span className="small dim">
                  {DOW_SHORT[ui.lang][dowOf(d)]} <b className="mono">{d.slice(8)}</b>
                </span>
                {nqEarn
                  .filter((e) => e.date === d)
                  .map((e) => (
                    <Link key={e.symbol} href={`/stock/${e.symbol}`} className={"ern-sym mono nq" + (e.hour === "amc" ? " amc" : "")}>
                      {e.symbol}
                    </Link>
                  ))}
              </div>
            ))}
        </div>
      )}
    </section>
  );
}

export async function NewsCard({ nowMs }: { nowMs: number }) {
  const { t } = await getT();
  const news = await getNews("general", 6);
  return (
    <section className="card" aria-label="News">
      <div className="row">
        <span className="lbl">News</span>
        <Link href="/news" className="small" style={{ fontWeight: 600 }}>
          {t("Xem tất cả")}
        </Link>
      </div>
      {!marketConfigured() ? (
        <p className="small dim">{t("Chưa có FINNHUB_API_KEY trên Vercel.")}</p>
      ) : !news.ok ? (
        <p className="small short">{news.error}</p>
      ) : news.items.length ? (
        <div className="news-list">
          {news.items.slice(0, 5).map((n) => (
            <NewsRow key={n.id} n={n} now={nowMs} compact href={`/news?cat=general&id=${encodeURIComponent(n.id)}`} />
          ))}
        </div>
      ) : (
        <p className="small dim">{t("Chưa có tin.")}</p>
      )}
    </section>
  );
}
