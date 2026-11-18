// Link ảnh plan qua proxy cùng origin (/api/plan/image), dùng chung server / client.
export const planImageSrc = (date: string, v?: string) => `/api/plan/image?date=${date}${v ? `&v=${encodeURIComponent(v)}` : ""}`;
