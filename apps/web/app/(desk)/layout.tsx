// Khung dashboard: chỉ chủ sở hữu (Discord) vào được. proxy.ts đã chặn trước, ở đây kiểm lại lần nữa.
import { requireOwner } from "@/lib/auth";
import { getUi } from "@/lib/prefs-server";
import Shell from "./_components/Sidebar";
import { UiProvider } from "./_components/Ui";

export const dynamic = "force-dynamic";

export default async function DeskLayout({ children }: { children: React.ReactNode }) {
  const owner = await requireOwner();
  const ui = await getUi();
  return (
    <UiProvider prefs={ui}>
      <Shell owner={owner}>{children}</Shell>
    </UiProvider>
  );
}
