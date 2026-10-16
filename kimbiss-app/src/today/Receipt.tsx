import { useTranslation } from "react-i18next";
import { formatNumber, formatTime } from "../locales/format.ts";
import type { Meal } from "../meal/meals.ts";
import { sum } from "./Budget.tsx";

type ReceiptProps = { meals: Meal[]; onOpen: (meal: Meal) => void };

/** The day's meals as an Imbiss receipt: time, dish, kcal, and the total. */
export function Receipt({ meals, onOpen }: ReceiptProps) {
  const { t } = useTranslation();
  return (
    <section className="receipt-edge bg-surface px-5 pt-5 pb-8 shadow-[0_1px_0_var(--line)]">
      <h2 className="mb-3 flex justify-between text-sm text-ink-soft">
        <span>{t("today.receipt")}</span>
        <span>kcal</span>
      </h2>
      {meals.length === 0 && <p className="py-6 text-center text-ink-soft">{t("today.empty")}</p>}
      <ul>
        {meals.map((meal) => (
          <li key={meal.id}>
            <button type="button" onClick={() => onOpen(meal)}
              className="flex w-full items-baseline gap-2 py-2.5 text-left active:opacity-60">
              <span className="w-12 shrink-0 text-sm text-ink-soft">{formatTime(meal.eaten_at)}</span>
              <span className="truncate">{meal.name}</span>
              <span aria-hidden className="min-w-4 flex-1 translate-y-[-4px] border-b-2 border-dotted border-line" />
              <span className="font-semibold">{formatNumber(meal.kcal)}</span>
            </button>
          </li>
        ))}
      </ul>
      {meals.length > 0 && (
        <p className="mt-2 flex justify-between border-t-2 border-dashed border-line pt-3 text-lg font-bold">
          <span>{t("today.total")}</span>
          <span>{formatNumber(sum(meals, "kcal"))}</span>
        </p>
      )}
    </section>
  );
}
