"use client";
// Biểu đồ nhỏ cho trang cổ phiếu: cột một chuỗi (EPS theo năm / quý), EPS thực tế vs dự báo, thanh khuyến nghị analyst.
// Một trục, cột mảnh bo đầu, lưới mờ; rê chuột hiện giá trị.
import { useState } from "react";
import { useUi } from "../../_components/Ui";

type Bar = { label: string; v: number; est?: number | null; note?: string };

const W = 520;
const H = 200;
const PAD = { l: 40, r: 10, t: 14, b: 26 };

function ticks(min: number, max: number) {
  const span = max - min || 1;
  const step = Math.pow(10, Math.floor(Math.log10(span / 4)));
  const m = [1, 2, 2.5, 5, 10].find((k) => span / (k * step) <= 5) || 10;
  const s = m * step;
  const out: number[] = [];
  for (let v = Math.floor(min / s) * s; v <= max + s / 2; v += s) out.push(Number(v.toFixed(6)));
  return out;
}
const fmt = (v: number, d = 2) => (Math.abs(v) >= 100 ? v.toFixed(0) : v.toFixed(d));

export function BarChart({ data, unit = "", title, estLabel }: { data: Bar[]; unit?: string; title: string; estLabel?: string }) {
  const { t } = useUi();
  const [hover, setHover] = useState<number | null>(null);
  if (!data.length) return <p className="small dim">{t("Chưa có dữ liệu.")}</p>;
  const vals = data.flatMap((d) => [d.v, d.est ?? d.v]);
  const tk = ticks(Math.min(0, ...vals), Math.max(0, ...vals));
  const lo = tk[0];
  const hi = tk[tk.length - 1];
  const iw = W - PAD.l - PAD.r;
  const ih = H - PAD.t - PAD.b;
  const y = (v: number) => PAD.t + ih - ((v - lo) / (hi - lo || 1)) * ih;
  const slot = iw / data.length;
  const bw = Math.min(28, slot * 0.5);
  const y0 = y(0);
  const h = hover === null ? null : data[hover];
  return (
    <figure className="chart" aria-label={title}>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={title} onMouseLeave={() => setHover(null)}>
        {tk.map((v) => (
          <g key={v}>
            <line x1={PAD.l} x2={W - PAD.r} y1={y(v)} y2={y(v)} className={v === 0 ? "ax0" : "grid"} />
            <text x={PAD.l - 6} y={y(v) + 3.5} textAnchor="end" className="tick">
              {fmt(v, 1)}
            </text>
          </g>
        ))}
        {data.map((d, i) => {
          const cx = PAD.l + slot * i + slot / 2;
          const top = Math.min(y(d.v), y0);
          const hgt = Math.max(1, Math.abs(y(d.v) - y0));
          const r = Math.min(4, hgt / 2, bw / 2);
          // bo 2 góc ở đầu cột (xa trục 0)
          const path =
            d.v >= 0
              ? `M${cx - bw / 2},${y0} V${top + r} Q${cx - bw / 2},${top} ${cx - bw / 2 + r},${top} H${cx + bw / 2 - r} Q${cx + bw / 2},${top} ${cx + bw / 2},${top + r} V${y0} Z`
              : `M${cx - bw / 2},${y0} V${top + hgt - r} Q${cx - bw / 2},${top + hgt} ${cx - bw / 2 + r},${top + hgt} H${cx + bw / 2 - r} Q${cx + bw / 2},${top + hgt} ${cx + bw / 2},${top + hgt - r} V${y0} Z`;
          return (
            <g key={d.label} onMouseEnter={() => setHover(i)}>
              <rect x={cx - slot / 2} y={PAD.t} width={slot} height={ih} fill="transparent" />
              <path d={path} className={"bar" + (d.v < 0 ? " neg" : "") + (hover === i ? " on" : "")} />
              {d.est !== undefined && d.est !== null && <circle cx={cx} cy={y(d.est)} r={4.5} className="est" />}
              <text x={cx} y={H - 8} textAnchor="middle" className="tick">
                {d.label}
              </text>
            </g>
          );
        })}
      </svg>
      {h && (
        <div className="chart-tip" style={{ left: `${((PAD.l + slot * hover! + slot / 2) / W) * 100}%` }}>
          <b>{h.label}</b>
          <span>
            {fmt(h.v)}
            {unit}
            {h.est !== undefined && h.est !== null ? ` · ${estLabel || t("dự báo")} ${fmt(h.est)}${unit}` : ""}
          </span>
          {h.note && <span className="dim">{h.note}</span>}
        </div>
      )}
      {data.some((d) => d.est !== undefined) && (
        <figcaption className="legend">
          <span>
            <span className="key bar-key" aria-hidden="true" />
            {t("Thực tế")}
          </span>
          <span>
            <span className="key est-key" aria-hidden="true" />
            {estLabel || t("Dự báo")}
          </span>
        </figcaption>
      )}
    </figure>
  );
}

const RECO_KEYS = [
  ["strongBuy", "Mua mạnh", "var(--long)"],
  ["buy", "Mua", "#6f9e86"],
  ["hold", "Giữ", "#6b7480"],
  ["sell", "Bán", "#b87a68"],
  ["strongSell", "Bán mạnh", "var(--short)"],
] as const;

export function RecoBar({ reco }: { reco: Record<string, number | string> }) {
  const { t } = useUi();
  const total = RECO_KEYS.reduce((a, [k]) => a + Number(reco[k] || 0), 0);
  if (!total) return <p className="small dim">{t("Chưa có dữ liệu.")}</p>;
  return (
    <div className="stack" style={{ gap: 10 }}>
      <div className="reco-bar" role="img" aria-label={RECO_KEYS.map(([k, l]) => `${t(l)} ${reco[k]}`).join(", ")}>
        {RECO_KEYS.map(([k, l, c]) =>
          Number(reco[k]) ? <span key={k} style={{ flexGrow: Number(reco[k]), background: c }} title={`${t(l)}: ${reco[k]}`} /> : null,
        )}
      </div>
      <div className="legend">
        {RECO_KEYS.map(([k, l, c]) => (
          <span key={k}>
            <span className="key" style={{ background: c }} aria-hidden="true" />
            {t(l)} <b className="mono">{reco[k]}</b>
          </span>
        ))}
      </div>
    </div>
  );
}
