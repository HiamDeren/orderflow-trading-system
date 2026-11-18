"use client";
// Chọn nhanh múi giờ hiển thị (cookie desk_tz). Select gốc phủ lên nhãn ngắn nên vẫn dùng bàn phím / màn hình đọc được.
import { TZS, tzShort } from "@/lib/prefs";
import Icon from "./Icon";
import { useUi } from "./Ui";

export default function TzPicker({ className = "" }: { className?: string }) {
  const { t, tz, setTz } = useUi();
  return (
    <label className={"tzpick " + className} title={t("Múi giờ hiển thị")}>
      <Icon name="globe" size={14} />
      <span className="mono">{tzShort(tz)}</span>
      <select value={tz} onChange={(e) => setTz(e.target.value)} aria-label={t("Múi giờ hiển thị")}>
        {TZS.map((z) => <option key={z.id} value={z.id}>{t(z.label)}</option>)}
      </select>
    </label>
  );
}
