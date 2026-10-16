import { useTranslation } from "react-i18next";
import { UtensilsCrossed } from "lucide-react";
import { formatNumber } from "../locales/format.ts";
import { numberText, parseNumber } from "../ui/ui.tsx";
import type { EstimateItem } from "./meals.ts";

export const NUTRIENTS = ["kcal", "protein", "carbs", "fat"] as const;
export type Nutrient = (typeof NUTRIENTS)[number];

type HeaderProps = { name: string; time: string; onName: (name: string) => void; onTime: (time: string) => void };

/** Cutlery in a violet disc, the meal name over its time; both editable in place. */
export function MealHeader({ name, time, onName, onTime }: HeaderProps) {
  const { t } = useTranslation();
  return (
    <div className="flex items-center gap-3.5">
      <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent">
        <UtensilsCrossed size={20} aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <input value={name} onChange={(event) => onName(event.target.value)} maxLength={120}
          placeholder={t("meal.name")} aria-label={t("meal.name")}
          className="w-full bg-transparent text-xl font-bold outline-none placeholder:text-ink-soft/60" />
        <input type="time" value={time} onChange={(event) => onTime(event.target.value)} aria-label={t("meal.time")}
          className="bg-transparent text-sm text-ink-soft outline-none" />
      </div>
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
    <div className="grid grid-cols-4 divide-x divide-line rounded-2xl bg-surface py-3.5">
      {NUTRIENTS.map((nutrient) => (
        <label key={nutrient} className="flex min-w-0 flex-col items-center gap-1 px-1">
          <span className="w-full truncate text-center text-xs text-ink-soft">{t(nutrient === "carbs" ? "macros.carbs_short" : `macros.${nutrient}`)}</span>
          <input inputMode="decimal" value={numberText(values[nutrient])}
            onChange={(event) => onChange(nutrient, parseNumber(event.target.value))}
            className={`w-full bg-transparent text-center text-xl font-extrabold outline-none ${nutrient === "kcal" ? "text-accent" : ""}`} />
          <span className="text-xs text-ink-soft">{nutrient === "kcal" ? "kcal" : "g"}</span>
        </label>
      ))}
    </div>
  );
}

/** The foods the photo showed, one row each: name over weight, kcal right. */
export function EstimateItems({ items }: { items: EstimateItem[] }) {
  const { t } = useTranslation();
  return (
    <section>
      <h3 className="mb-2.5 flex justify-between px-2">
        <span className="font-semibold">{t("meal.recognized")}</span>
        <span className="text-sm text-ink-soft">{t("meal.estimate_hint")}</span>
      </h3>
      <ul className="divide-y divide-line rounded-2xl bg-surface">
        {items.map((item, position) => (
          <li key={position} className="flex items-center gap-3 px-4 py-3">
            <span className="min-w-0 flex-1">
              <span className="block truncate font-semibold">{item.name}</span>
              <span className="text-sm text-ink-soft">{formatNumber(item.grams)} g</span>
            </span>
            <span className="font-semibold">{formatNumber(item.kcal)} <span className="text-sm font-normal text-ink-soft">kcal</span></span>
          </li>
        ))}
      </ul>
    </section>
  );
}
