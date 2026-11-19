"use client";
import { TZS } from "@/lib/prefs";
import LangSwitch from "../_components/LangSwitch";
import { useUi } from "../_components/Ui";

export default function DisplaySettings() {
  const { t, tz, setTz, side, setSide } = useUi();
  return (
    <section className="card tight" aria-label={t("Hiển thị")}>
      <span className="lbl" style={{ paddingBottom: 8 }}>{t("Hiển thị")}</span>
      <div className="row" style={{ minHeight: 52, borderBottom: "1px solid var(--line-2)" }}>
        <span className="stack" style={{ gap: 2 }}><span style={{ fontSize: 14 }}>{t("Ngôn ngữ")}</span><span className="small dim">{t("Mặc định tiếng Việt")}</span></span>
        <LangSwitch />
      </div>
      <label className="row" style={{ minHeight: 60, borderBottom: "1px solid var(--line-2)" }}>
        <span className="stack" style={{ gap: 2 }}>
          <span style={{ fontSize: 14 }}>{t("Múi giờ hiển thị")}</span>
          <span className="small dim">{t("Đồng hồ, giờ tin, nhóm ngày trong Calendar. Phiên và plan vẫn theo ET.")}</span>
        </span>
        <select className="input" value={tz} onChange={(e) => setTz(e.target.value)} style={{ maxWidth: 220 }}>
          {TZS.map((z) => <option key={z.id} value={z.id}>{z.label}</option>)}
        </select>
      </label>
      <div className="row" style={{ minHeight: 52 }}>
        <span className="stack" style={{ gap: 2 }}><span style={{ fontSize: 14 }}>Sidebar</span><span className="small dim">{t("Ghim mở rộng hoặc thu gọn thành cột icon")}</span></span>
        <div className="seg seg-xs" role="group" aria-label="Sidebar">
          <button aria-pressed={side === "pinned"} onClick={() => setSide("pinned")}>{t("Ghim")}</button>
          <button aria-pressed={side === "collapsed"} onClick={() => setSide("collapsed")}>{t("Thu gọn")}</button>
        </div>
      </div>
    </section>
  );
}
