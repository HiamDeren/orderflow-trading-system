// Đọc bài báo ngay trong Deren Desk (News, D42).
// Chỉ đọc URL có trong danh sách Finnhub vừa tải (trang /news tra theo id), không nhận URL tuỳ ý từ người dùng.
// Tải HTML phía server → @mozilla/readability (trên linkedom) tách phần thân → sanitize-html lọc thẻ an toàn.
// Không lưu database; cache theo fetch 1 giờ. Trang nguồn chặn bot / cần đăng nhập → trả lỗi, giao diện hiện tóm tắt + link gốc.
import { isIP } from "node:net";
import { Readability } from "@mozilla/readability";
import { parseHTML } from "linkedom";
import sanitizeHtml from "sanitize-html";

export type Article = { ok: true; title: string; byline: string; site: string; html: string; words: number; url: string } | { ok: false; error: string; url: string };

const MAX_BYTES = 3_000_000;
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36";

// Chặn địa chỉ nội bộ khi theo redirect (tránh SSRF)
function publicHttpUrl(raw: string) {
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    return null;
  }
  if (u.protocol !== "https:" && u.protocol !== "http:") return null;
  const h = u.hostname.replace(/^\[|\]$/g, "").toLowerCase();
  if (h === "localhost" || h.endsWith(".localhost") || h.endsWith(".internal") || h.endsWith(".local")) return null;
  if (isIP(h)) {
    if (/^(10\.|127\.|0\.|169\.254\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\.)/.test(h)) return null;
    if (h === "::1" || h.startsWith("fc") || h.startsWith("fd") || h.startsWith("fe80") || h.startsWith("::ffff:")) return null;
  }
  return u;
}

async function fetchHtml(start: string) {
  let url = start;
  for (let hop = 0; hop < 6; hop++) {
    const u = publicHttpUrl(url);
    if (!u) throw new Error("URL không hợp lệ");
    const r = await fetch(u, {
      redirect: "manual",
      headers: { "User-Agent": UA, Accept: "text/html,application/xhtml+xml", "Accept-Language": "en-US,en;q=0.9" },
      signal: AbortSignal.timeout(9000),
      next: { revalidate: 3600 },
    });
    if (r.status >= 300 && r.status < 400) {
      const loc = r.headers.get("location");
      if (!loc) throw new Error(`HTTP ${r.status}`);
      url = new URL(loc, u).toString();
      continue;
    }
    if (!r.ok) throw new Error(`Trang nguồn trả HTTP ${r.status}`);
    const type = r.headers.get("content-type") || "";
    if (!/html|xml/i.test(type)) throw new Error("Trang nguồn không phải HTML");
    const buf = await r.arrayBuffer();
    if (buf.byteLength > MAX_BYTES) throw new Error("Trang quá lớn");
    return { html: new TextDecoder("utf-8").decode(buf), url: u.toString() };
  }
  throw new Error("Quá nhiều lần chuyển hướng");
}

function clean(html: string, base: string) {
  const abs = (v?: string) => {
    if (!v) return "";
    try {
      const u = new URL(v, base);
      return u.protocol === "https:" || u.protocol === "http:" ? u.toString() : "";
    } catch {
      return "";
    }
  };
  return sanitizeHtml(html, {
    allowedTags: ["p", "br", "h2", "h3", "h4", "ul", "ol", "li", "blockquote", "strong", "b", "em", "i", "a", "img", "figure", "figcaption", "table", "thead", "tbody", "tr", "th", "td", "pre", "code", "hr", "sup", "sub"],
    allowedAttributes: { a: ["href", "target", "rel"], img: ["src", "alt", "loading", "referrerpolicy"], th: ["colspan", "rowspan"], td: ["colspan", "rowspan"] },
    allowedSchemes: ["http", "https"],
    transformTags: {
      h1: "h2",
      a: (_tag, attribs) => ({ tagName: "a", attribs: { href: abs(attribs.href), target: "_blank", rel: "noreferrer noopener" } }),
      img: (_tag, attribs) => ({ tagName: "img", attribs: { src: abs(attribs.src || attribs["data-src"]), alt: attribs.alt || "", loading: "lazy", referrerpolicy: "no-referrer" } }),
    },
    allowedSchemesAppliedToAttributes: ["href", "src"],
    exclusiveFilter: (f) => (f.tag === "img" && !f.attribs.src) || (f.tag === "a" && !f.attribs.href && !f.text.trim()) || (f.tag === "p" && !f.text.trim() && !f.mediaChildren?.length),
  });
}

export async function readArticle(url: string): Promise<Article> {
  try {
    const page = await fetchHtml(url);
    const { document } = parseHTML(page.html);
    const art = new Readability(document as unknown as Document, { charThreshold: 400 }).parse();
    if (!art || !art.content) return { ok: false, error: "Không tách được nội dung bài", url: page.url };
    const html = clean(art.content, page.url);
    const words = (art.textContent || "").trim().split(/\s+/).filter(Boolean).length;
    if (words < 80) return { ok: false, error: "Trang nguồn chỉ trả một phần nội dung (có thể cần đăng nhập)", url: page.url };
    return { ok: true, title: (art.title || "").trim(), byline: (art.byline || "").trim(), site: (art.siteName || "").trim(), html, words, url: page.url };
  } catch (e) {
    const err = e as Error;
    const msg = err.name === "TimeoutError" ? "Trang nguồn phản hồi quá chậm" : err.message === "fetch failed" ? "Không kết nối được trang nguồn" : String(err.message || e);
    return { ok: false, error: msg, url };
  }
}
