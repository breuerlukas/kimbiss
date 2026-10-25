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
 * What is left of today's energy as the headline, open on the page like
 * Insulink's glucose value, then the macros in one strip parted by lines.
 * Past the target the surplus turns red, with a plus, and so does the bar.
 */
export function Budget({ meals, profile }: BudgetProps) {
  const { t } = useTranslation();
  const eaten = sum(meals, "kcal");
  const left = Math.round(profile.kcal_target - eaten);
  const over = left < 0;
  return (
    <section aria-label={t("today.budget")}>
      <p className={`text-[104px] leading-[0.82] font-extrabold tracking-[-0.055em] max-[360px]:text-[88px] ${over ? "text-danger" : ""}`}>
        {over && "+"}{formatNumber(Math.abs(left))}
      </p>
      <p className="mt-4 flex flex-wrap items-baseline justify-between gap-x-3">
        <span className={`font-bold ${over ? "text-danger" : ""}`}>{t(over ? "today.kcal_over" : "today.kcal_left")}</span>
        <span className="text-sm text-ink-soft">
          {t("today.of_target", { eaten: formatNumber(eaten), target: formatNumber(profile.kcal_target) })}
        </span>
      </p>
      <Bar share={eaten / profile.kcal_target} color={over ? "bg-danger" : "bg-accent"} className="mt-3 h-2" />
      <dl className="mt-6 grid grid-cols-3 divide-x divide-line rounded-[20px] border border-rim bg-surface py-4">
        {MACROS.map((macro) => {
          const grams = sum(meals, macro.key);
          const target = profile[`${macro.key}_target`];
          return (
            <div key={macro.key} className="min-w-0 px-3.5">
              <dt className="truncate text-[13px] text-ink-soft">{t(macro.key === "carbs" ? "macros.carbs_short" : `macros.${macro.key}`)}</dt>
              <dd className="mt-0.5 text-xl font-extrabold whitespace-nowrap">
                {formatNumber(grams)}<span className="text-sm font-semibold text-ink-soft"> / {target} g</span>
              </dd>
              <Bar share={target ? grams / target : 0} color={macro.color} className="mt-2 h-1.5" />
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
