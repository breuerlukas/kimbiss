import { useTranslation } from "react-i18next";
import { formatNumber } from "../locales/format.ts";
import { Choice, NumberField } from "../ui/ui.tsx";
import { direction, KCAL_PER_KG, lowestGoalKg, PACES, type Activity, type Answers, type Sex } from "./targets.ts";

export type Draft = Partial<Answers>;
export type StepProps = { draft: Draft; change: (patch: Draft) => void };

export function BodyStep({ draft, change }: StepProps) {
  const { t } = useTranslation();
  const sexes: Sex[] = ["female", "male"];
  return (
    <div className="grid gap-4">
      <Choice value={draft.sex} onChange={(sex) => change({ sex })}
        options={sexes.map((sex) => ({ value: sex, label: t(`setup.sex.${sex}`) }))} />
      <p className="text-sm text-ink-soft">{t("setup.sex.hint")}</p>
      <div className="grid grid-cols-2 gap-3">
        <NumberField label={t("setup.birth_year")} inputMode="numeric" value={draft.birthYear}
          onValue={(birthYear) => change({ birthYear })} />
        <NumberField label={t("setup.height")} unit="cm" inputMode="numeric" value={draft.heightCm}
          onValue={(heightCm) => change({ heightCm })} />
      </div>
    </div>
  );
}

export function WeightStep({ draft, change }: StepProps) {
  const { t } = useTranslation();
  const lowest = draft.heightCm ? lowestGoalKg(draft.heightCm) : undefined;
  const tooLow = lowest !== undefined && draft.goalWeightKg !== undefined && draft.goalWeightKg < lowest;
  return (
    <div className="grid gap-4">
      <NumberField label={t("setup.current_weight")} unit="kg" value={draft.startWeightKg}
        onValue={(startWeightKg) => change({ startWeightKg })} />
      <NumberField label={t("setup.goal_weight")} unit="kg" value={draft.goalWeightKg}
        onValue={(goalWeightKg) => change({ goalWeightKg })} />
      <p className={tooLow ? "text-danger" : "text-sm text-ink-soft"}>
        {tooLow ? t("setup.goal_too_low", { kg: lowest }) : t("setup.goal_hint")}
      </p>
    </div>
  );
}

export function ActivityStep({ draft, change }: StepProps) {
  const { t } = useTranslation();
  const activities: Activity[] = ["sedentary", "light", "moderate", "active"];
  return (
    <Choice value={draft.activity} onChange={(activity) => change({ activity })}
      options={activities.map((activity) => ({
        value: activity,
        label: t(`setup.activity.${activity}._`),
        hint: t(`setup.activity.${activity}.hint`),
      }))} />
  );
}

/**
 * Each pace names both what changes on the scale per week and what it means
 * per day in kcal, below or above the body's need depending on the goal.
 */
export function PaceStep({ draft, change }: StepProps) {
  const { t } = useTranslation();
  const hint = direction(draft as Answers) < 0 ? "setup.pace.hint_lose" : "setup.pace.hint_gain";
  return (
    <Choice value={draft.weeklyChangeKg} onChange={(weeklyChangeKg) => change({ weeklyChangeKg })}
      options={PACES.map((pace) => ({
        value: pace.kg,
        label: t(`setup.pace.${pace.id}`),
        hint: t(hint, {
          kg: formatNumber(pace.kg, 2),
          kcal: formatNumber(Math.round(pace.kg * KCAL_PER_KG / 7 / 10) * 10),
        }),
      }))} />
  );
}

/** Whether a step's answers are complete and plausible enough to go on. */
export function stepDone(step: string, draft: Draft): boolean {
  const year = new Date().getFullYear();
  switch (step) {
    case "body":
      return !!draft.sex && between(draft.birthYear, year - 100, year - 14) && between(draft.heightCm, 120, 230);
    case "weight":
      return between(draft.startWeightKg, 30, 300) && between(draft.goalWeightKg, lowestGoalKg(draft.heightCm!), 300);
    case "activity":
      return !!draft.activity;
    case "pace":
      return draft.weeklyChangeKg !== undefined;
    default:
      return true;
  }
}

function between(value: number | undefined, low: number, high: number): boolean {
  return value !== undefined && value >= low && value <= high;
}
