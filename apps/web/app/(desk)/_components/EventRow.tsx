"use client";
import type { EconEvent } from "@/lib/econ";
import { IMPACT_LABEL } from "@/lib/econ-prefs";
import { tzShort } from "@/lib/prefs";
import { useUi } from "./Ui";

export function nums(e: EconEvent) {
  return `${e.actual || "—"} / ${e.forecast || "—"} / ${e.previous || "—"}`;
}

// Hàng tin đầy đủ (Calendar)
export default function EventRow({ e, showNums = true }: { e: EconEvent; showNums?: boolean }) {
  const { t, tz } = useUi();
  const sameTz = tz === "America/New_York";
  return (
    <div className="ev">
      <span className="t">
        <span className="mono" style={{ fontSize: 13, fontWeight: 600 }}>
          {e.allDay ? t("Cả ngày") : sameTz ? e.timeEt : e.timeLocal}
        </span>
        {!e.allDay && !sameTz && <span className="mono small dim">{e.timeEt} ET</span>}
      </span>
      <span className={"bar imp-" + e.impact} aria-hidden="true" />
      <span className="cur mono">{e.country}</span>
      <span className="name">
        <span style={{ fontSize: 13, fontWeight: 500 }}>{e.title}</span>
        <span className={"imp-text imp-t-" + e.impact}>
          {e.impact === "Holiday" ? t("Ngày nghỉ") : t("Tác động {x}", { x: t(IMPACT_LABEL[e.impact]).toLowerCase() })}
        </span>
      </span>
      {showNums && (
        <span className="nums" title={t("Thực tế / Dự báo / Trước")}>
          {nums(e)}
        </span>
      )}
    </div>
  );
}

// Hàng tin gọn một dòng (Dashboard)
export function EventLine({ e }: { e: EconEvent }) {
  const { t, tz } = useUi();
  const sameTz = tz === "America/New_York";
  return (
    <div className="evl" title={`${e.timeEt} ET · ${e.country} · ${e.title}`}>
      <span className={"dot imp-" + e.impact} aria-hidden="true" />
      <span className="mono evl-t">{e.allDay ? t("Cả ngày") : sameTz ? e.timeEt : e.timeLocal}</span>
      <span className="mono evl-c">{e.country}</span>
      <span className="evl-n">{e.title}</span>
    </div>
  );
}

export function TzHead() {
  const { tz } = useUi();
  return <>{tz === "America/New_York" ? "ET" : `${tzShort(tz)} · ET`}</>;
}
