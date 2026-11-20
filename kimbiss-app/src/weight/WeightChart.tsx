import { useTranslation } from "react-i18next";
import { formatDate, formatNumber } from "../locales/format.ts";
import type { WeightEntry } from "./weights.ts";

const WIDTH = 318;
const HEIGHT = 170;
const TOP = 26;
const BOTTOM = 10;
const SIDE = 14;

/**
 * The weighings as one line over time with the area under it, the goal weight
 * dashed across and named at its right end, the last weighing lit up. Plain
 * SVG: a single series needs no chart library.
 */
export function WeightChart({ entries, goalKg }: { entries: WeightEntry[]; goalKg: number }) {
  const { t } = useTranslation();
  if (entries.length < 2) {
    return <p className="py-12 text-center text-[13px] text-ink-soft">{t("weight.chart_empty")}</p>;
  }
  const times = entries.map((entry) => entry.measured_at);
  const kilos = [...entries.map((entry) => entry.kg), goalKg];
  const [firstTime, lastTime] = [Math.min(...times), Math.max(...times)];
  const [lowKg, highKg] = [Math.min(...kilos) - 0.5, Math.max(...kilos) + 0.5];
  const x = (time: number) => SIDE + (time - firstTime) / (lastTime - firstTime || 1) * (WIDTH - 2 * SIDE);
  const y = (kg: number) => TOP + (highKg - kg) / (highKg - lowKg) * (HEIGHT - TOP - BOTTOM);
  const line = entries.map((entry, index) => `${index ? "L" : "M"}${x(entry.measured_at)} ${y(entry.kg)}`).join(" ");
  const [first, last] = [entries[0], entries[entries.length - 1]];
  const kg = (value: number) => formatNumber(value, 1);
  const date = (time: number) => formatDate(new Date(time), { day: "numeric", month: "short" }).replace(/\.$/, "");
  return (
    <>
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full font-mono" role="img"
        aria-label={t("weight.chart_label", { from: kg(first.kg), fromDate: date(first.measured_at), to: kg(last.kg), toDate: date(last.measured_at), goal: kg(goalKg) })}>
        {[1, 2].map((third) => (
          <line key={third} x1={0} x2={WIDTH} y1={TOP + third * (HEIGHT - TOP - BOTTOM) / 3} y2={TOP + third * (HEIGHT - TOP - BOTTOM) / 3} stroke="rgb(255 255 255 / 0.05)" />
        ))}
        <line x1={0} x2={WIDTH} y1={y(goalKg)} y2={y(goalKg)} className="stroke-fat" strokeWidth={1.5} strokeDasharray="4 5" opacity={0.7} />
        <text x={WIDTH} y={y(goalKg) - 9} textAnchor="end" className="fill-fat text-[11px] font-semibold uppercase">
          {t("weight.goal_short", { kg: kg(goalKg) })}
        </text>
        <path d={`${line} L${x(last.measured_at)} ${HEIGHT - BOTTOM} L${x(first.measured_at)} ${HEIGHT - BOTTOM} Z`} className="fill-accent" opacity={0.1} />
        <path d={line} fill="none" className="stroke-accent" strokeWidth={3} strokeLinejoin="round" strokeLinecap="round" />
        <circle cx={x(first.measured_at)} cy={y(first.kg)} r={4} className="fill-surface stroke-accent" strokeWidth={2.5} />
        <circle cx={x(last.measured_at)} cy={y(last.kg)} r={9} className="fill-accent" opacity={0.2} />
        <circle cx={x(last.measured_at)} cy={y(last.kg)} r={5} className="fill-accent" />
        <text x={x(first.measured_at)} y={y(first.kg) - 13} className="fill-ink-soft text-[11px]">{kg(first.kg)}</text>
        <text x={x(last.measured_at)} y={y(last.kg) - 15} textAnchor="end" className="fill-ink text-[11px] font-semibold">{kg(last.kg)}</text>
      </svg>
      <div aria-hidden className="flex justify-between font-mono text-[11px] text-ink-soft uppercase">
        <span>{date(first.measured_at)}</span><span>{date(last.measured_at)}</span>
      </div>
    </>
  );
}
