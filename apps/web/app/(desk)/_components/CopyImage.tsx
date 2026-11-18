"use client";
// Nút copy ảnh plan vào clipboard (PNG, vì clipboard trình duyệt không nhận WebP).
import { useState } from "react";
import Icon from "./Icon";
import { useUi } from "./Ui";

async function toPng(src: string): Promise<Blob> {
  const res = await fetch(src, { cache: "force-cache" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const bmp = await createImageBitmap(await res.blob());
  const c = document.createElement("canvas");
  c.width = bmp.width;
  c.height = bmp.height;
  c.getContext("2d")!.drawImage(bmp, 0, 0);
  return new Promise((ok, fail) => c.toBlob((b) => (b ? ok(b) : fail(new Error("canvas"))), "image/png"));
}

export default function CopyImage({ src, small }: { src: string; small?: boolean }) {
  const { t } = useUi();
  const [state, setState] = useState<"idle" | "busy" | "ok" | "err">("idle");
  async function copy() {
    setState("busy");
    try {
      if (!navigator.clipboard || typeof ClipboardItem === "undefined") throw new Error("unsupported");
      // Truyền Promise vào ClipboardItem để Safari vẫn coi là thao tác của người dùng
      await navigator.clipboard.write([new ClipboardItem({ "image/png": toPng(src) })]);
      setState("ok");
    } catch {
      setState("err");
    }
    setTimeout(() => setState("idle"), 2200);
  }
  return (
    <button className={"btn" + (small ? " sm" : "")} onClick={copy} disabled={state === "busy"} aria-live="polite">
      <Icon name={state === "ok" ? "check" : "copy"} size={16} />
      {state === "ok" ? t("Đã copy ảnh") : state === "err" ? t("Trình duyệt chặn copy, mở ảnh để lưu") : state === "busy" ? t("Đang copy…") : t("Copy ảnh")}
    </button>
  );
}
