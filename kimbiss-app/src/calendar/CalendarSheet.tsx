import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ArrowRight, ChevronLeft, ChevronRight, X } from "lucide-react";
import { useLoad } from "../api/use-load.ts";
import { formatDate, formatNumber } from "../locales/format.ts";
import { findMealsBetween } from "../meal/meals.ts";
import { Chip, MACROS, RoundButton, Sheet } from "../ui/ui.tsx";
import { leadingBlanks, monthStats, startOfDay, startOfMonth, tone, totalsByDay, type Tone } from "./calendar.ts";

type CalendarProps = { open: boolean; day: Date; target: number; onClose: () => void; onPick: (day: Date) => void };

/** The month calendar as a sheet from 84 px below the top. */
export function CalendarSheet({ open, ...props }: CalendarProps) {
  const { t } = useTranslation();
  return (
    <Sheet open={open} onClose={props.onClose} label={t("calendar.title")} className="h-[calc(100dvh-84px)] max-h-none">
      {open && <Calendar {...props} />}
    </Sheet>
  );
}

const RING = 2 * Math.PI * 16;
const RING_COLOR: Record<Tone, string> = { none: "transparent", under: "var(--under)", on: "var(--accent)", over: "var(--over)" };

/**
 * One month, Monday first, a ring per day for eaten against the target, the
 * month's average and days on target on top, the picked day's numbers below
 * with a way to open it. The month's meals come in one request. Kimbiss keeps
 * no history of targets, so every day is measured against today's.
 */
function Calendar({ day, target, onClose, onPick }: Omit<CalendarProps, "open">) {
  const { t } = useTranslation();
  const today = startOfDay(new Date());
  const [month, setMonth] = useState(() => startOfMonth(day));
  const [picked, setPicked] = useState(() => startOfDay(day));
  const next = new Date(month.getFullYear(), month.getMonth() + 1, 1);
  const meals = useLoad(() => findMealsBetween(month, next), month.toDateString());
  const totals = totalsByDay(meals.data ?? [], month);
  const stats = monthStats(totals, month, today, target);
  const isCurrentMonth = month.getTime() === startOfMonth(today).getTime();
  const pickedTotals = picked.getMonth() === month.getMonth() ? totals[picked.getDate() - 1] : undefined;
  const weekdayShort = (date: Date) => formatDate(date, { weekday: "short" }).replace(".", "");

  function showMonth(step: number) {
    const shown = new Date(month.getFullYear(), month.getMonth() + step, 1);
    setMonth(shown);
    // The same day number in the new month, never past today or the month's end.
    const last = new Date(shown.getFullYear(), shown.getMonth() + 1, 0).getDate();
    const candidate = new Date(shown.getFullYear(), shown.getMonth(), Math.min(picked.getDate(), last));
    setPicked(candidate > today ? today : candidate);
  }

  return (
    <div className="flex flex-1 flex-col gap-3">
      {/* Close sits beside the stats, so the month's name keeps its row with the arrows from 360 px on. */}
      <div className="flex items-center justify-between gap-2 px-1">
        <span className="eyebrow min-w-0 truncate">
          {meals.data === undefined ? "\u00a0" : stats.logged === 0 ? t("calendar.no_stats")
            : t("calendar.stats", { average: formatNumber(stats.average), count: stats.onTarget })}
        </span>
        <RoundButton label={t("common.close")} onClick={onClose} className="border-transparent bg-surface-high"><X size={16} aria-hidden /></RoundButton>
      </div>
      <div className="-mt-2 flex items-center justify-between gap-2 px-1">
        <h2 className="min-w-0 truncate font-display text-[26px] leading-tight font-bold tracking-[-0.02em]">
          {formatDate(month, { month: "long", year: "numeric" })}
        </h2>
        <div className="flex gap-2">
          <RoundButton label={t("calendar.previous_month")} onClick={() => showMonth(-1)} className="bg-surface-raised"><ChevronLeft size={18} aria-hidden /></RoundButton>
          <RoundButton label={t("calendar.next_month")} onClick={() => showMonth(1)} disabled={isCurrentMonth} className="bg-surface-raised"><ChevronRight size={18} aria-hidden /></RoundButton>
        </div>
      </div>

      <div aria-hidden className="grid grid-cols-7 text-center font-mono text-[11px] text-ink-soft uppercase">
        {Array.from({ length: 7 }, (_, index) => (
          <span key={index}>{weekdayShort(new Date(2024, 0, 1 + index)) /* 1 January 2024 was a Monday */}</span>
        ))}
      </div>

      {meals.error && <p role="alert" className="text-center text-danger">{t(`errors.${meals.error}`, t("errors.load_failed"))}</p>}
      <div className="grid grid-cols-7 gap-y-1.5">
        {Array.from({ length: leadingBlanks(month) }, (_, index) => <div key={`blank${index}`} />)}
        {totals.map((totalsOfDay, index) => {
          const date = new Date(month.getFullYear(), month.getMonth(), index + 1);
          const future = date > today;
          const isToday = date.getTime() === today.getTime();
          const isPicked = date.getTime() === picked.getTime();
          const kcal = meals.data ? totalsOfDay.kcal : 0;
          const label = `${weekdayShort(date)}, ${formatDate(date, { day: "numeric", month: "long" })}: ${
            kcal ? t("calendar.cell_kcal", { kcal: formatNumber(kcal), target: formatNumber(target) }) : t("calendar.not_logged")}`;
          return (
            <button key={index} type="button" disabled={future} aria-label={label} aria-pressed={isPicked} onClick={() => setPicked(date)}
              className={`flex h-14 flex-col items-center gap-px rounded-[14px] pt-0.5 ${isPicked ? "bg-accent-soft" : isToday ? "bg-white/5" : ""} ${future ? "text-ink-faint" : "text-ink"}`}>
              <span className="relative flex size-[38px] items-center justify-center">
                <svg aria-hidden width={38} height={38} viewBox="0 0 38 38" className="absolute inset-0 -rotate-90">
                  {!future && <circle cx={19} cy={19} r={16} fill="none" stroke="var(--track)" strokeWidth={3.5} />}
                  {kcal > 0 && <circle cx={19} cy={19} r={16} fill="none" stroke={RING_COLOR[tone(kcal, target)]} strokeWidth={3.5}
                    strokeLinecap="round" strokeDasharray={`${Math.min(kcal / target, 1) * RING} ${RING}`} />}
                </svg>
                <span className={`relative font-display text-sm ${isToday || isPicked ? "font-extrabold" : "font-medium"}`}>{index + 1}</span>
              </span>
              <span className={`font-mono text-[10px] ${isPicked ? "text-accent" : "text-ink-soft"}`}>
                {future ? " " : kcal ? `${formatNumber(kcal / 1000, 1)}k` : "·"}
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap justify-center gap-x-3.5 gap-y-1 text-[11px] font-medium text-ink-soft">
        {(["under", "on", "over"] as const).map((key) => (
          <span key={key} className="flex items-center gap-1.5">
            <span aria-hidden className="size-2.5 rounded-full border-[2.5px]" style={{ borderColor: RING_COLOR[key] }} />
            {t(`calendar.legend_${key}`)}
          </span>
        ))}
      </div>

      {pickedTotals && meals.data && (
        <div className="mt-auto flex flex-col gap-3 rounded-[22px] border border-white/7 bg-surface-raised p-4">
          <div className="flex items-center justify-between gap-2">
            <span className="truncate text-[13px] font-medium text-ink-soft">
              {weekdayShort(picked)}, {formatDate(picked, { day: "numeric", month: "long" })}
              {picked.getTime() === today.getTime() && ` · ${t("calendar.today")}`}
            </span>
            <Status kcal={pickedTotals.kcal} target={target} isToday={picked.getTime() === today.getTime()} />
          </div>
          <p className="flex items-baseline gap-1.5">
            <span className="font-display text-[40px] leading-none font-extrabold tracking-[-0.03em]">{formatNumber(pickedTotals.kcal)}</span>
            <span className="text-sm text-ink-soft">/ {formatNumber(target)} kcal</span>
          </p>
          <p className="flex flex-wrap gap-x-4 gap-y-1 font-mono text-xs text-ink-soft">
            {MACROS.map((macro) => (
              <span key={macro.key}><span aria-hidden className={macro.text}>● </span>
                {t(`calendar.macro_${macro.key}`, { grams: formatNumber(pickedTotals[macro.key]) })}</span>
            ))}
          </p>
          <button type="button" onClick={() => onPick(picked)}
            className="flex h-12 items-center justify-center gap-2 rounded-full bg-accent text-[15px] font-semibold text-accent-ink transition active:scale-[0.98]">
            {t("calendar.open_day")}<ArrowRight size={16} aria-hidden />
          </button>
        </div>
      )}
    </div>
  );
}

/** How the day went, as a chip: not logged, left (today), over, on or under target. */
function Status({ kcal, target, isToday }: { kcal: number; target: number; isToday: boolean }) {
  const { t } = useTranslation();
  const diff = formatNumber(Math.abs(Math.round(kcal - target)));
  const dayTone = tone(kcal, target);
  if (dayTone === "none") {
    return <Chip tone="bg-white/6 text-ink-soft">{t("calendar.status_none")}</Chip>;
  }
  if (isToday && kcal < target) {
    return <Chip tone="bg-accent-soft text-accent">{t("calendar.status_left", { kcal: diff })}</Chip>;
  }
  if (dayTone === "over") {
    return <Chip tone="bg-over/14 text-over">{t("calendar.status_over", { kcal: diff })}</Chip>;
  }
  if (dayTone === "on") {
    return <Chip tone="bg-accent-soft text-accent">{t("calendar.status_on")}</Chip>;
  }
  return <Chip tone="bg-under/25 text-under-text">{t("calendar.status_under", { kcal: diff })}</Chip>;
}
