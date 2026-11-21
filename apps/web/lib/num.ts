// Đổi giá trị từ API ngoài (Finnhub, CoinGecko) thành số hữu hạn, rỗng / lỗi → null.
export const num = (v: unknown): number | null => (v === null || v === undefined || v === "" || !Number.isFinite(Number(v)) ? null : Number(v));
