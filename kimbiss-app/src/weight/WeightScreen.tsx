import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { ArrowDown, ArrowUp, Trash2 } from "lucide-react";
import { errorCode } from "../api/client.ts";
import { useLoad } from "../api/use-load.ts";
import { formatDate, formatNumber } from "../locales/format.ts";
import type { Profile } from "../profile/profile.ts";
import { Chip, NumberInput, SectionHeader } from "../ui/ui.tsx";
import { WeightChart } from "./WeightChart.tsx";
import { addWeight, deleteWeight, findWeights, goalProgress } from "./weights.ts";

const DAY = 24 * 60 * 60 * 1000;
const RANGES = [
  { key: "week", days: 7 },
  { key: "month", days: 30 },
  { key: "quarter", days: 91 },
  { key: "all", days: Infinity },
] as const;
type Range = (typeof RANGES)[number]["key"];

/** Log a weighing, see the line towards the goal weight, fix mistakes. */
export function WeightScreen({ profile }: { profile: Profile }) {
  const { t } = useTranslation();
  const weights = useLoad(findWeights, "weights");
  const [kg, setKg] = useState<number>();
  const [error, setError] = useState<string>();
  const [range, setRange] = useState<Range>("month");
  const entries = weights.data ?? [];
  const latest = entries[entries.length - 1];
  const start = profile.start_weight_kg;
  const goal = profile.goal_weight_kg;
  const since = Date.now() - RANGES.find((option) => option.key === range)!.days * DAY;

  async function run(action: () => Promise<unknown>) {
    setError(undefined);
    try {
      await action();
      weights.reload();
    } catch (failure) {
      setError(errorCode(failure));
    }
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    run(() => addWeight(kg!).then(() => setKg(undefined)));
  }

  const shownError = error ?? weights.error;
  const listed = [...entries].reverse();
  const towardGoal = (from: number, to: number) => Math.abs(goal - to) <= Math.abs(goal - from);
  const progress = latest ? goalProgress(start, goal, latest.kg) : 0;
  const shortDate = (time: number) => `${formatDate(new Date(time), { weekday: "short" }).replace(".", "")} · ${
    formatDate(new Date(time), { day: "numeric", month: "short" }).replace(/\.$/, "")}`;

  return (
    <div>
      <header className="flex flex-col gap-0.5">
        <span className="eyebrow">{t("weight.overline")}</span>
        <h1 className="font-display text-[28px] leading-tight font-bold tracking-[-0.02em]">{t("weight.title")}</h1>
      </header>
      {latest && (
        <>
          <div className="mt-5 flex flex-wrap items-end justify-between gap-2">
            <p className="flex items-baseline gap-1.5 font-display">
              <span className="text-[76px] leading-[0.9] font-extrabold tracking-[-0.045em]">{formatNumber(latest.kg, 1)}</span>
              <span className="text-[22px] font-medium text-ink-soft">kg</span>
            </p>
            {latest.kg !== start && <span className="mb-1.5"><Change kg={latest.kg - start} toward={towardGoal(start, latest.kg)} arrow /></span>}
          </div>
          <div className="mt-4 flex flex-col gap-2">
            <p className="flex justify-between gap-3 text-[13px]">
              <span className="text-ink-soft">
                {progress >= 1 ? t("weight.goal_reached") : <>{t("weight.left_before")}<strong className="font-semibold text-ink">{formatNumber(Math.abs(goal - latest.kg), 1)} kg</strong>{t("weight.left_after")}</>}
              </span>
              <span className="font-mono text-xs text-ink-soft uppercase">{formatNumber(goal, 1)} kg</span>
            </p>
            <div className="h-2 rounded-full bg-track">
              <div className="h-2 rounded-full bg-accent transition-[width] duration-500" style={{ width: `${progress * 100}%` }} />
            </div>
            <p className="flex justify-between font-mono text-[11px] text-ink-soft uppercase">
              <span>{t("weight.start", { kg: formatNumber(start, 1) })}</span><span>{formatNumber(Math.round(progress * 100))} %</span>
            </p>
          </div>
        </>
      )}
      <div className="mt-5 flex flex-col gap-2.5 rounded-3xl border border-rim bg-surface px-4 pt-3.5 pb-3">
        <div role="radiogroup" aria-label={t("weight.range")} className="flex gap-1 rounded-[14px] bg-paper p-1">
          {RANGES.map((option) => (
            <button key={option.key} type="button" role="radio" aria-checked={range === option.key} onClick={() => setRange(option.key)}
              className={`h-8 flex-1 rounded-[10px] text-xs font-semibold transition-colors ${range === option.key ? "bg-surface-high text-ink" : "text-ink-soft"}`}>
              {t(`weight.ranges.${option.key}`)}
            </button>
          ))}
        </div>
        <WeightChart entries={entries.filter((entry) => entry.measured_at >= since)} goalKg={goal} />
      </div>
      <form onSubmit={submit} className="mt-4 flex flex-col gap-2">
        <label htmlFor="weight-today" className="text-[13px] font-medium text-ink-soft">{t("weight.today")}</label>
        <div className="flex w-full gap-2">
          <span className="flex h-[52px] min-w-0 flex-1 items-center gap-2 rounded-[18px] border border-white/10 bg-surface px-4 outline-accent focus-within:outline-[1.5px]">
            <NumberInput id="weight-today" value={kg} onValue={setKg} size={4} placeholder={latest ? formatNumber(latest.kg, 1) : ""}
              className="w-full min-w-0 flex-1 bg-transparent font-display text-lg font-semibold outline-none placeholder:text-ink-soft/60" />
            <span className="text-sm text-ink-soft">kg</span>
          </span>
          <button type="submit" disabled={kg === undefined || kg < 30 || kg > 300}
            className="h-[52px] shrink-0 rounded-[18px] bg-accent px-[22px] text-[15px] font-semibold text-accent-ink transition active:scale-[0.98] disabled:opacity-40">
            {t("common.save")}
          </button>
        </div>
      </form>
      {shownError && <p role="alert" className="mt-3 rounded-2xl bg-danger/10 px-4 py-3 font-semibold text-danger">{t(`errors.${shownError}`, t("errors.unknown"))}</p>}
      {listed.length > 0 && (
        <section className="mt-6">
          <SectionHeader title={t("weight.history")} meta={t("weight.count", { count: listed.length })} />
          <ul className="divide-y divide-line rounded-[20px] border border-rim bg-surface">
            {listed.map((entry, position) => {
              const before = listed[position + 1];
              const date = new Date(entry.measured_at);
              return (
                <li key={entry.id} className="flex items-center gap-3 py-2.5 pr-2 pl-4">
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="font-display text-[17px] font-bold">{formatNumber(entry.kg, 1)} kg</span>
                    <span className="font-mono text-[11px] text-ink-soft uppercase">{shortDate(entry.measured_at)}</span>
                  </span>
                  {before ? <Change kg={entry.kg - before.kg} toward={towardGoal(before.kg, entry.kg)} />
                    : <Chip tone="bg-white/6 text-ink-soft">{t("weight.first")}</Chip>}
                  <button type="button" aria-label={t("weight.delete", { date: formatDate(date, { day: "numeric", month: "long" }) })}
                    className="flex size-11 shrink-0 items-center justify-center rounded-full text-ink-soft active:bg-surface-high"
                    onClick={() => run(() => deleteWeight(entry.id))}>
                    <Trash2 size={18} aria-hidden />
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}

/**
 * A change in weight as a chip: in `fat` toward the goal, in `carbs` away from
 * it. With `arrow` an arrow and the unit, else a signed number ("+2,0").
 */
function Change({ kg, toward, arrow = false }: { kg: number; toward: boolean; arrow?: boolean }) {
  const Arrow = kg < 0 ? ArrowDown : ArrowUp;
  return (
    <Chip tone={toward ? "bg-fat/12 text-fat" : "bg-carbs/12 text-carbs"}>
      {arrow ? <><Arrow size={14} aria-hidden />{formatNumber(Math.abs(kg), 1)} kg</>
        : `${kg > 0 ? "+" : kg < 0 ? "−" : "±"}${formatNumber(Math.abs(kg), 1)}`}
    </Chip>
  );
}
