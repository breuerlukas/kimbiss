import { useTranslation } from "react-i18next";
import { formatNumber, formatTime } from "../locales/format.ts";
import { useSavedPhoto } from "../meal/MealSheet.tsx";
import type { Meal } from "../meal/meals.ts";
import { MACROS } from "../ui/ui.tsx";

/**
 * A meal as a card: its photo (or the time) as a tile, the name over a bar of
 * the macros' shares of its energy and their grams, the kcal on the right.
 */
export function MealCard({ meal, onOpen }: { meal: Meal; onOpen: () => void }) {
  const { t } = useTranslation();
  const photoUrl = useSavedPhoto(meal);
  const energy = MACROS.reduce((total, macro) => total + meal[macro.key] * macro.kcalPerGram, 0);
  return (
    <button type="button" onClick={onOpen}
      className="flex w-full items-center gap-3 rounded-[20px] border border-rim bg-surface py-3 pr-4 pl-3 text-left transition active:scale-[0.99]">
      <span className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-[14px] bg-surface-high font-mono text-[11px] text-ink-soft">
        {photoUrl ? <img src={photoUrl} alt="" className="size-full object-cover" /> : formatTime(meal.eaten_at)}
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-1.5">
        <span className="truncate text-[15px] font-semibold">{meal.name}</span>
        <span aria-hidden className="flex h-1 gap-0.5">
          {energy > 0 && MACROS.map((macro) => (
            <span key={macro.key} className={`rounded-full ${macro.bar}`} style={{ width: `${meal[macro.key] * macro.kcalPerGram / energy * 100}%` }} />
          ))}
        </span>
        <span className="truncate font-mono text-[11px] text-ink-soft">
          {t("today.meal_macros", { protein: formatNumber(meal.protein), carbs: formatNumber(meal.carbs), fat: formatNumber(meal.fat) })}
        </span>
      </span>
      <span className="flex shrink-0 flex-col items-end">
        <span className="font-display text-xl font-bold tracking-[-0.02em]">{formatNumber(meal.kcal)}</span>
        <span className="text-[11px] text-ink-soft">kcal</span>
      </span>
    </button>
  );
}
