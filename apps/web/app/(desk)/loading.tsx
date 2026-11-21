// Hiện ngay khi chuyển trang trong dashboard (Next.js bọc page bằng Suspense), thay cho màn hình đứng yên
// trong lúc server lấy dữ liệu. Sidebar / thanh trên (layout) vẫn giữ nguyên.
import { getT } from "@/lib/prefs-server";
import { PageSkeleton } from "./_components/Skeleton";

export default async function Loading() {
  const { t } = await getT();
  return <PageSkeleton label={t("Đang tải…")} />;
}
