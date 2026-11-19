// Trang chỉ chủ sở hữu (D48): khách bị chuyển về /dashboard (proxy.ts đã chặn trước, đây là lớp kiểm thứ hai).
import { requireOwner } from "@/lib/auth";

export default async function OwnerOnly({ children }: { children: React.ReactNode }) {
  await requireOwner();
  return children;
}
