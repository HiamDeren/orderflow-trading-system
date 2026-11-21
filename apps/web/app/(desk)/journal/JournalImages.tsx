"use client";
// Ảnh chụp lệnh / chart của một ngày journal: tải lên, dán (Ctrl+V), kéo thả, ghi chú, gắn lệnh, xem lớn.
import { useCallback, useEffect, useRef, useState } from "react";
import type { JournalImage } from "@/lib/journal-images";
import Icon from "../_components/Icon";
import { useUi } from "../_components/Ui";

const MAX_W = 2560;
const LIMIT = 4 * 1024 * 1024; // Vercel nhận body tối đa ~4.5 MB

// Thu nhỏ ở trình duyệt trước khi gửi (server nén WebP lần nữa)
async function shrink(file: File): Promise<Blob> {
  if (file.size < 1.5 * 1024 * 1024 && file.type !== "image/png") return file;
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, MAX_W / bmp.width);
  const c = document.createElement("canvas");
  c.width = Math.round(bmp.width * scale);
  c.height = Math.round(bmp.height * scale);
  c.getContext("2d")!.drawImage(bmp, 0, 0, c.width, c.height);
  bmp.close();
  const enc = (type: string, q?: number) => new Promise<Blob | null>((ok) => c.toBlob(ok, type, q));
  let b = await enc("image/webp", 0.92);
  if (!b || b.type !== "image/webp") b = await enc("image/jpeg", 0.9);
  if (b && b.size > LIMIT) b = await enc("image/jpeg", 0.8);
  if (!b) throw new Error("encode");
  return b;
}

const src = (i: JournalImage) => `/api/journal/image?id=${i.id}`;

export default function JournalImages({ date, initial, tradeCount, error }: { date: string; initial: JournalImage[]; tradeCount: number; error?: string }) {
  const { t } = useUi();
  const [images, setImages] = useState(initial);
  const [busy, setBusy] = useState(0);
  const [msg, setMsg] = useState(error ? `${t("Chưa dùng được ảnh journal")}: ${error}` : "");
  const [open, setOpen] = useState<number | null>(null);
  const [drag, setDrag] = useState(false);
  const [confirmDel, setConfirmDel] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);

  const upload = useCallback(
    async (files: File[]) => {
      const imgs = files.filter((f) => /^image\/(png|jpeg|webp)$/.test(f.type));
      if (!imgs.length) return setMsg(t("Chỉ nhận PNG, JPEG, WebP"));
      setMsg("");
      setBusy((n) => n + imgs.length);
      for (const f of imgs) {
        try {
          const blob = await shrink(f);
          const fd = new FormData();
          fd.set("date", date);
          fd.set("file", blob, f.name || "paste.png");
          const r = await fetch("/api/journal/image", { method: "POST", body: fd });
          const j = await r.json().catch(() => ({}));
          if (!r.ok) throw new Error(j.error || `HTTP ${r.status}`);
          setImages((l) => [...l, j.image as JournalImage]);
        } catch (e) {
          setMsg(`${t("Tải ảnh lỗi")}: ${(e as Error).message}`);
        } finally {
          setBusy((n) => n - 1);
        }
      }
    },
    [date, t],
  );

  // Dán ảnh từ clipboard ở bất kỳ đâu trên trang (chữ vẫn dán bình thường)
  useEffect(() => {
    if (error) return;
    const onPaste = (e: ClipboardEvent) => {
      const files = Array.from(e.clipboardData?.files || []).filter((f) => f.type.startsWith("image/"));
      if (!files.length) return;
      e.preventDefault();
      upload(files);
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [upload, error]);

  // Phím tắt khi đang xem lớn
  useEffect(() => {
    if (open === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null);
      if (e.key === "ArrowRight") setOpen((i) => (i === null ? i : (i + 1) % images.length));
      if (e.key === "ArrowLeft") setOpen((i) => (i === null ? i : (i - 1 + images.length) % images.length));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, images.length]);

  async function patch(id: string, body: { caption?: string; trade_seq?: number | null }) {
    const r = await fetch("/api/journal/image", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, ...body }) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) return setMsg(`${t("Lưu ảnh lỗi")}: ${j.error || r.status}`);
    setImages((l) => l.map((x) => (x.id === id ? (j.image as JournalImage) : x)));
  }

  async function remove(id: string) {
    setConfirmDel(null);
    const r = await fetch(`/api/journal/image?id=${id}`, { method: "DELETE" });
    if (!r.ok) {
      const j = await r.json().catch(() => ({}));
      return setMsg(`${t("Xoá ảnh lỗi")}: ${j.error || r.status}`);
    }
    setImages((l) => l.filter((x) => x.id !== id));
    setOpen(null);
  }

  const cur = open === null ? null : images[open];

  return (
    <section
      className={"card jimg" + (drag ? " drag" : "")}
      aria-label={t("Ảnh lệnh")}
      onDragOver={(e) => {
        if (error) return;
        e.preventDefault();
        setDrag(true);
      }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDrag(false);
        if (!error) upload(Array.from(e.dataTransfer.files));
      }}
    >
      <div className="row wrap">
        <span className="lbl">{t("Ảnh lệnh · {n}", { n: images.length })}</span>
        <div className="hstack" style={{ gap: 8 }}>
          {busy > 0 && <span className="small dim">{t("Đang tải {n} ảnh…", { n: busy })}</span>}
          <button className="btn sm" disabled={!!error} onClick={() => input.current?.click()}>
            <Icon name="plus" size={14} /> {t("Thêm ảnh")}
          </button>
          <input
            ref={input}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            multiple
            hidden
            onChange={(e) => {
              upload(Array.from(e.target.files || []));
              e.target.value = "";
            }}
          />
        </div>
      </div>
      {msg && <div className="notice small">{msg}</div>}
      {images.length ? (
        <div className="jimg-grid">
          {images.map((img, i) => (
            <figure key={img.id} className="jimg-item">
              <button className="jimg-thumb" onClick={() => setOpen(i)} aria-label={t("Xem ảnh lớn")}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src(img)} alt={img.caption || t("Ảnh lệnh")} loading="lazy" />
                {img.trade_seq && <span className="jimg-tag mono">#{img.trade_seq}</span>}
              </button>
              <figcaption className="jimg-meta">
                <input
                  className="jimg-cap"
                  defaultValue={img.caption || ""}
                  placeholder={t("Ghi chú ảnh…")}
                  maxLength={300}
                  onBlur={(e) => e.target.value.trim() !== (img.caption || "") && patch(img.id, { caption: e.target.value })}
                  onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
                />
                <div className="row" style={{ gap: 6 }}>
                  <select
                    className="jimg-sel"
                    value={img.trade_seq ?? ""}
                    onChange={(e) => patch(img.id, { trade_seq: e.target.value ? Number(e.target.value) : null })}
                    aria-label={t("Gắn với lệnh")}
                  >
                    <option value="">{t("Ảnh chung")}</option>
                    {Array.from({ length: Math.max(tradeCount, img.trade_seq || 0) }, (_, k) => (
                      <option key={k + 1} value={k + 1}>
                        {t("Lệnh {n}", { n: k + 1 })}
                      </option>
                    ))}
                  </select>
                  {confirmDel === img.id ? (
                    <span className="hstack" style={{ gap: 4 }}>
                      <button className="btn sm danger" onClick={() => remove(img.id)}>
                        {t("Xoá")}
                      </button>
                      <button className="btn sm" onClick={() => setConfirmDel(null)}>
                        {t("Huỷ")}
                      </button>
                    </span>
                  ) : (
                    <button className="btn icon sm" onClick={() => setConfirmDel(img.id)} aria-label={t("Xoá ảnh")}>
                      <Icon name="trash" size={14} />
                    </button>
                  )}
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      ) : (
        !error && (
          <button className="jimg-drop" onClick={() => input.current?.click()}>
            <Icon name="image" size={22} />
            <span>{t("Kéo thả, dán (Ctrl+V) hoặc bấm để thêm ảnh chụp lệnh / chart")}</span>
          </button>
        )
      )}

      {cur && (
        <div className="lightbox" role="dialog" aria-modal="true" aria-label={cur.caption || t("Ảnh lệnh")} onClick={() => setOpen(null)}>
          <div className="lightbox-bar" onClick={(e) => e.stopPropagation()}>
            <span className="small">
              {open! + 1}/{images.length}
              {cur.trade_seq ? ` · ${t("Lệnh {n}", { n: cur.trade_seq })}` : ""}
              {cur.caption ? ` · ${cur.caption}` : ""}
            </span>
            <span className="hstack" style={{ gap: 6 }}>
              <a className="btn sm" href={src(cur)} target="_blank" rel="noreferrer">
                <Icon name="external" size={14} /> {t("Mở tab mới")}
              </a>
              <button className="btn icon sm" onClick={() => setOpen(null)} aria-label={t("Đóng")}>
                <Icon name="close" size={16} />
              </button>
            </span>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src(cur)} alt={cur.caption || ""} onClick={(e) => e.stopPropagation()} />
          {images.length > 1 && (
            <>
              <button
                className="lightbox-nav prev"
                onClick={(e) => {
                  e.stopPropagation();
                  setOpen((open! - 1 + images.length) % images.length);
                }}
                aria-label={t("Ảnh trước")}
              >
                ‹
              </button>
              <button
                className="lightbox-nav next"
                onClick={(e) => {
                  e.stopPropagation();
                  setOpen((open! + 1) % images.length);
                }}
                aria-label={t("Ảnh sau")}
              >
                ›
              </button>
            </>
          )}
        </div>
      )}
    </section>
  );
}
