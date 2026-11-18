// Nén ảnh trước khi lưu Supabase Storage (gói free có giới hạn dung lượng).
//   plan    : ảnh server vẽ (chữ + khối màu phẳng) → WebP lossless: giống từng pixel, nhỏ hơn PNG ~70% (331 KB → ~99 KB).
//   journal : ảnh chụp màn hình / chart do người dùng tải lên → xoay theo EXIF, thu về tối đa 2560 px chiều ngang,
//             WebP chất lượng 85 (chữ footprint vẫn đọc được), bỏ metadata.
import sharp from "sharp";
import type { StorageKind } from "@/lib/storage";

export const IMAGE_EXT = "webp";
export const IMAGE_MIME = "image/webp";
const JOURNAL_MAX_WIDTH = 2560;

export async function optimizeImage(input: Buffer | Uint8Array, kind: StorageKind): Promise<Buffer> {
  const img = sharp(input, { failOn: "error" });
  if (kind === "plan") return img.webp({ lossless: true, effort: 6 }).toBuffer();
  return img
    .rotate()
    .resize({ width: JOURNAL_MAX_WIDTH, withoutEnlargement: true })
    .webp({ quality: 85, effort: 5, smartSubsample: true })
    .toBuffer();
}
