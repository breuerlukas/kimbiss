import { useTranslation } from "react-i18next";
import type { WeightEntry } from "./weights.ts";

const WIDTH = 320;
const HEIGHT = 160;
const PADDING = 12;

/**
 * The weighings as one line over time, with the goal weight dashed across.
 * Plain SVG: a single series needs no chart library.
 */
export function WeightChart({ entries, goalKg }: { entries: WeightEntry[]; goalKg: number }) {
  const { t } = useTranslation();
  if (entries.length < 2) {
    return <p className="py-8 text-center text-ink-soft">{t("weight.chart_empty")}</p>;
  }
  const times = entries.map((entry) => entry.measured_at);
  const kilos = [...entries.map((entry) => entry.kg), goalKg];
  const [firstTime, lastTime] = [Math.min(...times), Math.max(...times)];
  const [lowKg, highKg] = [Math.min(...kilos) - 1, Math.max(...kilos) + 1];
  const x = (time: number) => PADDING + (time - firstTime) / (lastTime - firstTime || 1) * (WIDTH - 2 * PADDING);
  const y = (kg: number) => PADDING + (highKg - kg) / (highKg - lowKg) * (HEIGHT - 2 * PADDING);
  const points = entries.map((entry) => `${x(entry.measured_at)},${y(entry.kg)}`).join(" ");
  const last = entries[entries.length - 1];
  return (
    <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full" role="img" aria-label={t("weight.chart_label")}>
      <line x1={PADDING} x2={WIDTH - PADDING} y1={y(goalKg)} y2={y(goalKg)}
        className="stroke-ink-soft" strokeDasharray="4 5" strokeWidth={1.5} />
      <polyline points={points} fill="none" className="stroke-accent" strokeWidth={3}
        strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={x(last.measured_at)} cy={y(last.kg)} r={6} className="fill-accent stroke-ink" strokeWidth={2} />
    </svg>
  );
}
