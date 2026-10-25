import { useTranslation } from "react-i18next";
import { Utensils, X } from "lucide-react";
import { formatNumber } from "../locales/format.ts";
import { NumberInput, RoundButton, SectionHeader } from "../ui/ui.tsx";
import type { EstimateItem } from "./meals.ts";

export const NUTRIENTS = ["kcal", "protein", "carbs", "fat"] as const;
export type Nutrient = (typeof NUTRIENTS)[number];

type HeaderProps = {
  name: string;
  day: string;
  time: string;
  onName: (name: string) => void;
  onTime: (time: string) => void;
  onClose: () => void;
};

/**
 * Insulink's meal-detail head: cutlery in a violet disc, the meal name over
 * "Heute, 12:40", a round close button on the right. Name and time are edited
 * in place.
 */
export function MealHeader({ name, day, time, onName, onTime, onClose }: HeaderProps) {
  const { t } = useTranslation();
  return (
    <div className="flex items-center gap-3.5">
      <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent">
        <Utensils size={20} aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <input value={name} onChange={(event) => onName(event.target.value)} maxLength={120}
          placeholder={t("meal.name")} aria-label={t("meal.name")}
          className="w-full bg-transparent text-[22px] leading-tight font-extrabold outline-none placeholder:font-bold placeholder:text-ink-soft/60" />
        <label className="flex items-baseline gap-1 text-ink-soft">
          {day},
          <input type="time" value={time} onChange={(event) => onTime(event.target.value)} aria-label={t("meal.time")}
            className="bg-transparent font-semibold text-ink-soft outline-none" />
        </label>
      </div>
      <RoundButton label={t("common.close")} onClick={onClose}><X size={20} /></RoundButton>
    </div>
  );
}

type StripProps = { values: Partial<Record<Nutrient, number>>; onChange: (nutrient: Nutrient, value?: number) => void };

/**
 * Energy and the three macros side by side, parted by lines, as in Insulink's
 * meal detail. Each value is a plain input: tap the number to correct it.
 */
export function NutrientStrip({ values, onChange }: StripProps) {
  const { t } = useTranslation();
  return (
    <div className="grid grid-cols-4 divide-x divide-line rounded-[20px] border border-rim bg-surface py-3.5">
      {NUTRIENTS.map((nutrient) => (
        <label key={nutrient} className="flex min-w-0 flex-col items-center gap-0.5 px-1">
          <span className="w-full truncate text-center text-[13px] text-ink-soft">{t(nutrient === "carbs" ? "macros.carbs_short" : `macros.${nutrient}`)}</span>
          <NumberInput value={values[nutrient]} onValue={(value) => onChange(nutrient, value)} placeholder="0"
            className={`w-full rounded-lg bg-transparent text-center text-[22px] font-extrabold outline-none placeholder:text-ink-soft/35 focus:bg-accent-soft ${nutrient === "kcal" ? "text-accent" : ""}`} />
          <span className="text-[13px] font-semibold text-ink-soft">{nutrient === "kcal" ? "kcal" : "g"}</span>
        </label>
      ))}
    </div>
  );
}

/**
 * The foods the photo showed, in one panel as Insulink lists a meal's
 * products: name over its weight and macros, kcal on the right. A fresh
 * estimate says under it that the numbers want a look.
 */
export function EstimateItems({ items, fresh }: { items: EstimateItem[]; fresh: boolean }) {
  const { t } = useTranslation();
  return (
    <section>
      <SectionHeader title={t("meal.recognized")}>
        <span className="text-sm text-ink-soft">{t("meal.foods", { count: items.length })}</span>
      </SectionHeader>
      <ul className="divide-y divide-line rounded-[20px] border border-rim bg-surface">
        {items.map((item, position) => (
          <li key={position} className="flex min-h-[64px] items-center gap-3 px-4 py-3">
            <span className="min-w-0 flex-1">
              <span className="block truncate font-bold">{item.name}</span>
              <span className="block truncate text-[13px] text-ink-soft">
                {t("meal.item_detail", {
                  grams: formatNumber(item.grams), protein: formatNumber(item.protein),
                  carbs: formatNumber(item.carbs), fat: formatNumber(item.fat),
                })}
              </span>
            </span>
            <span className="text-[17px] font-extrabold whitespace-nowrap">{formatNumber(item.kcal)}<span className="text-sm font-semibold text-ink-soft"> kcal</span></span>
          </li>
        ))}
      </ul>
      {fresh && <p className="mt-2 px-1 text-sm text-ink-soft">{t("meal.estimate_hint")}</p>}
    </section>
  );
}
