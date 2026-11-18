import type { EconEvent } from "@/lib/econ";
import { IMPACT_LABEL } from "@/lib/econ-prefs";

export function nums(e: EconEvent) {
  return `${e.actual || "—"} / ${e.forecast || "—"} / ${e.previous || "—"}`;
}

export default function EventRow({ e, showNums = true }: { e: EconEvent; showNums?: boolean }) {
  return (
    <div className={"ev" + (e.inSession ? " in" : "")}>
      <span className="t">
        <span className="mono" style={{ fontSize: 13, fontWeight: 600 }}>{e.timeEt}</span>
        <span className="mono small dim">{e.timeVn}</span>
      </span>
      <span className={"bar imp-" + e.impact} aria-hidden="true" />
      <span className="cur mono">{e.country}</span>
      <span className="name">
        <span style={{ fontSize: 13, fontWeight: 500 }}>{e.title}</span>
        <span className={"imp-text imp-t-" + e.impact}>
          {e.impact === "Holiday" ? "Ngày nghỉ" : "Tác động " + IMPACT_LABEL[e.impact].toLowerCase()}
          {e.inSession && <span className="accent"> · trong phiên NY AM</span>}
        </span>
      </span>
      {showNums && <span className="nums" title="Thực tế / Dự báo / Trước">{nums(e)}</span>}
    </div>
  );
}
