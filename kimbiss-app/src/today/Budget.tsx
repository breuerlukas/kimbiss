import { useTranslation } from "react-i18next";
import { formatNumber } from "../locales/format.ts";
import type { Meal } from "../meal/meals.ts";
import type { Profile } from "../profile/profile.ts";
import { MACROS, MacroCard } from "../ui/ui.tsx";

type BudgetProps = { meals: Meal[]; profile: Profile };

const SEGMENTS = 36;

/**
 * What is left of the day's energy as the headline, a bar of 36 segments for
 * what was eaten, then a card per macro. Past the target the headline counts
 * the surplus with a plus, and it and the bar turn to the `over` colour.
 */
export function Budget({ meals, profile }: BudgetProps) {
  const { t } = useTranslation();
  const eaten = sum(meals, "kcal");
  const left = Math.round(profile.kcal_target - eaten);
  const over = left < 0;
  const filled = Math.min(SEGMENTS, Math.round(eaten / profile.kcal_target * SEGMENTS));
  return (
    <section aria-label={t("today.budget")}>
      <p className="mt-7 text-[13px] font-medium text-ink-soft">{t(over ? "today.kcal_over" : "today.kcal_left")}</p>
      <p className={`mt-1.5 flex items-baseline gap-2 font-display ${over ? "text-over" : ""}`}>
        <span className="text-[88px] leading-[0.9] font-extrabold tracking-[-0.045em]">{over && "+"}{formatNumber(Math.abs(left))}</span>
        <span className="text-[22px] font-medium text-ink-soft">kcal</span>
      </p>
      <div aria-hidden className="mt-5 flex gap-[3px]">
        {Array.from({ length: SEGMENTS }, (_, index) => (
          <div key={index} className={`h-[26px] flex-1 rounded-[3px] ${index >= filled ? "bg-track" : over ? "bg-over" : "bg-accent"}`} />
        ))}
      </div>
      <p className="mt-2 flex justify-between gap-3 font-mono text-[11px] text-ink-soft uppercase">
        <span>{t("today.eaten", { kcal: formatNumber(eaten) })}</span>
        <span>{t("today.target", { kcal: formatNumber(profile.kcal_target) })}</span>
      </p>
      <div className="mt-5 grid grid-cols-3 gap-2">
        {MACROS.map((macro) => {
          const grams = sum(meals, macro.key);
          const target = profile[`${macro.key}_target`];
          return <MacroCard key={macro.key} macro={macro} value={formatNumber(grams)} unit={`/ ${formatNumber(target)} g`}
            share={target ? grams / target : 0} />;
        })}
      </div>
    </section>
  );
}

export function sum(meals: Meal[], key: "kcal" | "protein" | "carbs" | "fat"): number {
  return Math.round(meals.reduce((total, meal) => total + meal[key], 0));
}
