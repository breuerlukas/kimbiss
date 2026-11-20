import { useEffect, useReducer, useState } from "react";
import { useTranslation } from "react-i18next";
import { Camera, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { useLoad } from "../api/use-load.ts";
import { formatDate, formatNumber } from "../locales/format.ts";
import { MealSheet, type MealDraft } from "../meal/MealSheet.tsx";
import { findMeals } from "../meal/meals.ts";
import type { Profile } from "../profile/profile.ts";
import { Button, RoundButton, SectionHeader } from "../ui/ui.tsx";
import { Budget, sum } from "./Budget.tsx";
import { MealCard } from "./MealCard.tsx";

type TodayProps = {
  profile: Profile;
  draft: MealDraft | null;
  setDraft: (draft: MealDraft | null) => void;
  onTakePhoto: () => void;
};

/**
 * One day: what is left, the macros and the day's meals. The day is kept as
 * days back from today, so "today" follows the clock: an app left open
 * overnight shows, and saves meals to, the new day once it is back in front.
 * Budget and meals only show once the day's meals have loaded, so a slow or
 * failed load never looks like an empty day.
 */
export function TodayScreen({ profile, draft, setDraft, onTakePhoto }: TodayProps) {
  const { t } = useTranslation();
  const [offset, setOffset] = useState(0);
  const [, wake] = useReducer((count: number) => count + 1, 0);
  const now = new Date();
  const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset, 12);
  const meals = useLoad(() => findMeals(day), day.toDateString());
  const isToday = offset === 0;

  useEffect(() => {
    const show = () => wake();
    document.addEventListener("visibilitychange", show);
    return () => document.removeEventListener("visibilitychange", show);
  }, []);

  /** Closes the meal sheet and frees the estimate photo it may have shown. */
  function closeSheet() {
    if (draft?.photoUrl) {
      URL.revokeObjectURL(draft.photoUrl);
    }
    setDraft(null);
  }

  function shiftDay(days: number) {
    setOffset(Math.min(0, offset + days));
  }

  return (
    <div>
      <header className="flex items-center justify-between gap-3">
        <div className="flex min-h-11 min-w-0 flex-col gap-0.5">
          <span className="eyebrow truncate">{dayOverline(day)}</span>
          <h1 className="truncate font-display text-[28px] leading-tight font-bold tracking-[-0.02em]">
            {isToday ? t("today.title") : formatDate(day, { weekday: "long" })}
          </h1>
        </div>
        <div className="flex gap-2">
          <RoundButton label={t("today.previous_day")} onClick={() => shiftDay(-1)}><ChevronLeft size={18} aria-hidden /></RoundButton>
          <RoundButton label={t("today.next_day")} onClick={() => shiftDay(1)} disabled={isToday}><ChevronRight size={18} aria-hidden /></RoundButton>
        </div>
      </header>
      {meals.error && (
        <div role="alert" className="mt-4 flex items-center justify-between gap-3">
          <p className="text-danger">{t(`errors.${meals.error}`, t("errors.load_failed"))}</p>
          <Button variant="quiet" onClick={meals.reload}>{t("common.retry")}</Button>
        </div>
      )}
      {meals.data && (
        <>
          <Budget meals={meals.data} profile={profile} />
          <section className="mt-7">
            <SectionHeader title={t("today.meals")} meta={meals.data.length === 0
              ? t("today.meals_meta_empty")
              : t("today.meals_meta", { count: meals.data.length, kcal: formatNumber(sum(meals.data, "kcal")) })}>
              <RoundButton label={t("meal.add")} onClick={() => setDraft({})}><Plus size={18} aria-hidden /></RoundButton>
            </SectionHeader>
            {meals.data.length === 0 ? <Empty onTakePhoto={onTakePhoto} /> : (
              <ul className="flex flex-col gap-2">
                {meals.data.map((meal) => (
                  <li key={meal.id}><MealCard meal={meal} onOpen={() => setDraft({ meal })} /></li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
      <MealSheet draft={draft} day={day} onClose={closeSheet}
        onSaved={() => {
          closeSheet();
          meals.reload();
        }} />
    </div>
  );
}

/** A day without meals: a dashed card that asks for a photo. */
function Empty({ onTakePhoto }: { onTakePhoto: () => void }) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center gap-2.5 rounded-3xl border-[1.5px] border-dashed border-accent/28 bg-accent/3 px-5 py-7 text-center">
      <span className="flex size-14 items-center justify-center rounded-full bg-accent-soft text-accent"><Camera size={24} aria-hidden /></span>
      <span className="font-display text-[17px] font-bold">{t("today.empty_title")}</span>
      <span className="text-[13px] text-ink-soft">{t("today.empty_hint")}</span>
      <button type="button" onClick={onTakePhoto}
        className="mt-1.5 flex h-11 items-center gap-2 rounded-full bg-accent px-5 text-sm font-semibold text-accent-ink transition active:scale-[0.98]">
        {t("today.empty_action")}
      </button>
    </div>
  );
}

/** "FR · 20. NOVEMBER": the weekday without its abbreviation dot, then the date (capitals by CSS). */
export function dayOverline(day: Date): string {
  return `${formatDate(day, { weekday: "short" }).replace(".", "")} · ${formatDate(day, { day: "numeric", month: "long" })}`;
}
