import { useTranslation } from "react-i18next";
import { formatDate, formatNumber } from "../locales/format.ts";
import { Field, numberText, parseNumber } from "../ui/ui.tsx";
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
      <Field label={t("setup.summary.kcal")} unit="kcal" inputMode="numeric"
        value={numberText(targets.kcal)}
        onChange={(event) => change({ kcal: parseNumber(event.target.value) })} />
      <div className="grid grid-cols-3 gap-3">
        {macros.map((macro) => (
          <Field key={macro.key} label={t(`macros.${macro.key}`)} unit="g" inputMode="numeric"
            value={numberText(macro.value)}
            onChange={(event) => change({ [macro.key]: parseNumber(event.target.value) })} />
        ))}
      </div>
      <p className="text-sm text-ink-soft">{t("setup.summary.hint")}</p>
    </div>
  );
}
