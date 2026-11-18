// Khung dashboard: chỉ chủ sở hữu (Discord) vào được. proxy.ts đã chặn trước, ở đây kiểm lại lần nữa.
import { requireOwner } from "@/lib/auth";
import Sidebar from "./_components/Sidebar";

export const dynamic = "force-dynamic";

export default async function DeskLayout({ children }: { children: React.ReactNode }) {
  const owner = await requireOwner();
  return (
    <div className="shell">
      <Sidebar owner={owner} />
      <main className="main">{children}</main>
    </div>
  );
}
