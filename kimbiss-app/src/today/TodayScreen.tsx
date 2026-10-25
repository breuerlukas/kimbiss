import { useEffect, useReducer, useState } from "react";
import { useTranslation } from "react-i18next";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { useLoad } from "../api/use-load.ts";
import { formatDate } from "../locales/format.ts";
import { MealSheet, type MealDraft } from "../meal/MealSheet.tsx";
import { findMeals } from "../meal/meals.ts";
import { PhotoButton } from "../meal/PhotoButton.tsx";
import type { Profile } from "../profile/profile.ts";
import { Button, RoundButton, SectionHeader } from "../ui/ui.tsx";
import { Budget } from "./Budget.tsx";
import { Receipt } from "./Receipt.tsx";

/**
 * One day: what is left, the macros, the receipt, and the camera button in the
 * dock's slot (`dockAction`). The day
 * is kept as days back from today, so "today" follows the clock: an app left
 * open overnight shows, and saves meals to, the new day once it is back in
 * front. Budget and receipt only show once the day's meals have loaded, so a
 * slow or failed load never looks like an empty day.
 */
export function TodayScreen({ profile, dockAction }: { profile: Profile; dockAction: HTMLElement | null }) {
  const { t } = useTranslation();
  const [offset, setOffset] = useState(0);
  const [, wake] = useReducer((count: number) => count + 1, 0);
  const [draft, setDraft] = useState<MealDraft | null>(null);
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
    setOffset(offset + days);
  }

  return (
    <div>
      <header className="mb-7 flex items-center justify-between gap-3">
        <h1 className="truncate text-[22px] font-bold">
          {isToday ? t("today.title") : formatDate(day, { weekday: "long", day: "numeric", month: "long" })}
        </h1>
        <div className="flex gap-2">
          <RoundButton label={t("today.previous_day")} onClick={() => shiftDay(-1)}><ChevronLeft size={20} /></RoundButton>
          <RoundButton label={t("today.next_day")} onClick={() => shiftDay(1)} disabled={isToday}><ChevronRight size={20} /></RoundButton>
        </div>
      </header>
      {meals.error && (
        <div role="alert" className="mb-4 flex items-center justify-between gap-3">
          <p className="text-danger">{t(`errors.${meals.error}`, t("errors.load_failed"))}</p>
          <Button variant="quiet" onClick={meals.reload}>{t("common.retry")}</Button>
        </div>
      )}
      {meals.data && (
        <>
          <Budget meals={meals.data} profile={profile} />
          <section className="mt-9">
            <SectionHeader title={t("today.receipt")}>
              <RoundButton label={t("meal.add")} onClick={() => setDraft({})}><Plus size={20} /></RoundButton>
            </SectionHeader>
            <Receipt meals={meals.data} onOpen={(meal) => setDraft({ meal })} />
          </section>
        </>
      )}
      {dockAction && createPortal(
        <PhotoButton onEstimate={(estimate, photoUrl, photo) => setDraft({ estimate, photoUrl, photo })} />,
        dockAction,
      )}
      <MealSheet draft={draft} day={day} onClose={closeSheet}
        onSaved={() => {
          closeSheet();
          meals.reload();
        }} />
    </div>
  );
}
