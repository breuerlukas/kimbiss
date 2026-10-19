import { useTranslation } from "react-i18next";
import { formatDate, formatNumber } from "../locales/format.ts";
import { NumberField } from "../ui/ui.tsx";
import { direction, type Answers, type Targets } from "./targets.ts";

type SummaryProps = {
  answers: Answers;
  targets: Targets;
  change: (patch: Partial<Targets>) => void;
};

/** The proposed daily targets, editable, and when the goal weight is reached. */
export function SetupSummary({ answers, targets, change }: SummaryProps) {
  const { t } = useTranslation();
  const goalDate = targets.weeks === null ? null
    : new Date(Date.now() + targets.weeks * 7 * 24 * 60 * 60 * 1000);
  const macros = [
    { key: "protein", value: targets.protein },
    { key: "carbs", value: targets.carbs },
    { key: "fat", value: targets.fat },
  ] as const;
  return (
    <div className="grid gap-4">
      <p className="text-ink-soft">
        {t("setup.summary.maintenance", { kcal: formatNumber(targets.maintenanceKcal) })}{" "}
        {goalDate
          ? t("setup.summary.goal_date", {
            date: formatDate(goalDate, { month: "long", year: "numeric" }),
            weeks: targets.weeks,
          })
          : t(direction(answers) === 0 ? "setup.summary.hold" : "setup.summary.no_date")}
      </p>
      <NumberField label={t("setup.summary.kcal")} unit="kcal" inputMode="numeric"
        value={targets.kcal} onValue={(kcal) => change({ kcal })} />
      <div className="grid grid-cols-3 gap-3">
        {macros.map((macro) => (
          <NumberField key={macro.key} label={t(`macros.${macro.key}`)} unit="g" inputMode="numeric"
            value={macro.value} onValue={(grams) => change({ [macro.key]: grams })} />
        ))}
      </div>
      <p className="text-sm text-ink-soft">{t("setup.summary.hint")}</p>
    </div>
  );
}
