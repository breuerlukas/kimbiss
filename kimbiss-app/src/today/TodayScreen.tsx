import { useEffect, useReducer, useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useLoad } from "../api/use-load.ts";
import { formatDate } from "../locales/format.ts";
import { MealSheet, type MealDraft } from "../meal/MealSheet.tsx";
import { findMeals } from "../meal/meals.ts";
import { PhotoButton } from "../meal/PhotoButton.tsx";
import type { Profile } from "../profile/profile.ts";
import { Button } from "../ui/ui.tsx";
import { Budget } from "./Budget.tsx";
import { Receipt } from "./Receipt.tsx";

/**
 * One day: what is left, the macros, the receipt, and the photo button. The day
 * is kept as days back from today, so "today" follows the clock: an app left
 * open overnight shows, and saves meals to, the new day once it is back in
 * front. Budget and receipt only show once the day's meals have loaded, so a
 * slow or failed load never looks like an empty day.
 */
export function TodayScreen({ profile }: { profile: Profile }) {
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
    <div className="pb-28">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-lg font-semibold">
          {isToday ? t("today.title") : formatDate(day, { weekday: "long", day: "numeric", month: "long" })}
        </h1>
        <div className="flex gap-1">
          <IconButton label={t("today.previous_day")} onClick={() => shiftDay(-1)}><ChevronLeft /></IconButton>
          <IconButton label={t("today.next_day")} onClick={() => shiftDay(1)} disabled={isToday}><ChevronRight /></IconButton>
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
          <div className="mt-8">
            <Receipt meals={meals.data} onOpen={(meal) => setDraft({ meal })} />
          </div>
        </>
      )}
      <div className="fixed inset-x-0 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] mx-auto max-w-lg px-5">
        <PhotoButton onEstimate={(estimate, photoUrl, photo) => setDraft({ estimate, photoUrl, photo })} onManual={() => setDraft({})} />
      </div>
      <MealSheet draft={draft} day={day} onClose={closeSheet}
        onSaved={() => {
          closeSheet();
          meals.reload();
        }} />
    </div>
  );
}

type IconButtonProps = { label: string; onClick: () => void; disabled?: boolean; children: React.ReactNode };

function IconButton({ label, onClick, disabled, children }: IconButtonProps) {
  return (
    <button type="button" aria-label={label} onClick={onClick} disabled={disabled}
      className="flex h-11 w-11 items-center justify-center rounded-full active:bg-line disabled:opacity-30">
      {children}
    </button>
  );
}
