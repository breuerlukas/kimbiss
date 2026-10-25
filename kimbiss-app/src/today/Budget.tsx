import { useTranslation } from "react-i18next";
import { formatNumber } from "../locales/format.ts";
import type { Meal } from "../meal/meals.ts";
import type { Profile } from "../profile/profile.ts";

type BudgetProps = { meals: Meal[]; profile: Profile };

const MACROS = [
  { key: "protein", color: "bg-protein" },
  { key: "carbs", color: "bg-carbs" },
  { key: "fat", color: "bg-fat" },
] as const;

/**
 * What is left of today's energy as the headline, then one bar per macro.
 * Past the target the surplus turns red, with a plus, and so does the bar.
 */
export function Budget({ meals, profile }: BudgetProps) {
  const { t } = useTranslation();
  const eaten = sum(meals, "kcal");
  const left = Math.round(profile.kcal_target - eaten);
  const over = left < 0;
  return (
    <section aria-label={t("today.budget")}>
      <p className={`text-7xl leading-none font-extrabold tracking-tighter ${over ? "text-danger" : ""}`}>
        {over && "+"}{formatNumber(Math.abs(left))}
      </p>
      <p className={`mt-1 text-lg font-semibold ${over ? "text-danger" : ""}`}>{t(over ? "today.kcal_over" : "today.kcal_left")}</p>
      <p className="text-ink-soft">
        {t("today.of_target", { eaten: formatNumber(eaten), target: formatNumber(profile.kcal_target) })}
      </p>
      <Bar share={eaten / profile.kcal_target} color={over ? "bg-danger" : "bg-accent"} className="mt-4 h-3" />
      <dl className="mt-5 grid grid-cols-3 gap-3">
        {MACROS.map((macro) => {
          const grams = sum(meals, macro.key);
          const target = profile[`${macro.key}_target`];
          return (
            <div key={macro.key}>
              <dt className="truncate text-sm text-ink-soft">{t(`macros.${macro.key}`)}</dt>
              <dd className="font-semibold whitespace-nowrap max-[380px]:text-sm">{formatNumber(grams)}<span className="font-normal text-ink-soft"> / {target} g</span></dd>
              <Bar share={target ? grams / target : 0} color={macro.color} className="mt-1.5 h-1.5" />
            </div>
          );
        })}
      </dl>
    </section>
  );
}

function Bar({ share, color, className }: { share: number; color: string; className: string }) {
  return (
    <div className={`overflow-hidden rounded-full bg-line ${className}`}>
      <div className={`h-full rounded-full ${color} transition-[width] duration-500`}
        style={{ width: `${Math.min(100, share * 100)}%` }} />
    </div>
  );
}

export function sum(meals: Meal[], key: "kcal" | "protein" | "carbs" | "fat"): number {
  return Math.round(meals.reduce((total, meal) => total + meal[key], 0));
}
