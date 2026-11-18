// Ảnh journal (D43): bảng trading.journal_images + file trong bucket trading (YYYY/MM/DD/journal/<id>.webp).
import { randomUUID } from "node:crypto";
import sharp from "sharp";
import { db, storage } from "@/lib/db";
import { IMAGE_EXT, IMAGE_MIME, optimizeImage } from "@/lib/image";
import { dayPath } from "@/lib/storage";

export type JournalImage = {
  id: string;
  created_at: string;
  trade_date: string;
  path: string;
  caption: string | null;
  trade_seq: number | null;
  width: number | null;
  height: number | null;
  bytes: number | null;
};

const TABLE = "journal_images";
export const MAX_UPLOAD = 8 * 1024 * 1024; // sau khi trình duyệt đã thu nhỏ; Vercel giới hạn body ~4.5 MB nên client nén trước
export const MAX_PER_DAY = 30;

export function imageUrl(img: Pick<JournalImage, "id">) {
  return `/api/journal/image?id=${img.id}`;
}

export async function listImages(date: string): Promise<JournalImage[]> {
  return db.select<JournalImage>(TABLE, `select=*&trade_date=eq.${date}&order=created_at.asc`);
}

export async function getImage(id: string): Promise<JournalImage | null> {
  const rows = await db.select<JournalImage>(TABLE, `select=*&id=eq.${id}&limit=1`);
  return rows[0] || null;
}

export async function addImage(date: string, input: Buffer, caption: string | null, tradeSeq: number | null): Promise<JournalImage> {
  const existing = await db.select<{ id: string }>(TABLE, `select=id&trade_date=eq.${date}`);
  if (existing.length >= MAX_PER_DAY) throw new Error(`Tối đa ${MAX_PER_DAY} ảnh / ngày`);
  const out = await optimizeImage(input, "journal");
  const meta = await sharp(out).metadata();
  const id = randomUUID();
  const path = dayPath(date, "journal", `${id}.${IMAGE_EXT}`);
  await storage.put(path, out, IMAGE_MIME);
  try {
    const rows = await db.insert<JournalImage>(TABLE, {
      id,
      trade_date: date,
      path,
      caption,
      trade_seq: tradeSeq,
      width: meta.width ?? null,
      height: meta.height ?? null,
      bytes: out.length,
    });
    return rows[0];
  } catch (e) {
    await storage.remove([path]).catch(() => undefined); // không để file mồ côi
    throw e;
  }
}

export async function updateImage(id: string, patch: { caption?: string | null; trade_seq?: number | null }) {
  return db.update<JournalImage>(TABLE, `id=eq.${id}`, patch);
}

export async function deleteImage(id: string) {
  const img = await getImage(id);
  if (!img) return false;
  await db.remove(TABLE, `id=eq.${id}`);
  await storage.remove([img.path]).catch((e) => console.error("[journal-image] storage remove", String(e)));
  return true;
}
