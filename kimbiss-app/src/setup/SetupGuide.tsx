import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { Profile } from "../profile/profile.ts";
import { saveProfile } from "../profile/profile.ts";
import { Button } from "../ui/ui.tsx";
import { addWeight } from "../weight/weights.ts";
import { ActivityStep, BodyStep, PaceStep, stepDone, WeightStep, type Draft } from "./SetupSteps.tsx";
import { SetupSummary } from "./SetupSummary.tsx";
import { direction, suggestTargets, type Answers, type Targets } from "./targets.ts";

const STEPS = { body: BodyStep, weight: WeightStep, activity: ActivityStep, pace: PaceStep };
type Step = keyof typeof STEPS | "summary";

type GuideProps = { previous: Profile | null; onDone: (profile: Profile) => void; onCancel?: () => void };

/**
 * Asks body, weight goal, activity and pace one screen at a time, then proposes
 * daily targets the user can still change. Run again from the profile tab, it
 * starts from the saved answers.
 */
export function SetupGuide({ previous, onDone, onCancel }: GuideProps) {
  const { t } = useTranslation();
  const [draft, setDraft] = useState<Draft>(previous ? answersOf(previous) : {});
  const [targets, setTargets] = useState<Targets>();
  const [index, setIndex] = useState(0);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const holding = draft.startWeightKg !== undefined && direction(draft as Answers) === 0;
  const steps: Step[] = ["body", "weight", "activity", ...(holding ? [] : ["pace" as const]), "summary"];
  const step = steps[index];

  function next() {
    if (steps[index + 1] === "summary") {
      const answers = { ...draft, weeklyChangeKg: holding ? 0 : draft.weeklyChangeKg } as Answers;
      setDraft(answers);
      setTargets(suggestTargets(answers, new Date().getFullYear()));
    }
    setIndex(index + 1);
  }

  async function finish() {
    setBusy(true);
    setFailed(false);
    try {
      const profile = await saveProfile(profileOf(draft as Answers, targets!));
      if (previous?.start_weight_kg !== profile.start_weight_kg) {
        await addWeight(profile.start_weight_kg);
      }
      onDone(profile);
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  }

  const StepBody = step === "summary" ? null : STEPS[step];
  const summaryValid = targets && targets.kcal >= 800 && [targets.protein, targets.carbs, targets.fat]
    .every((grams) => grams !== undefined && grams >= 0);
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col px-6 pt-[max(2rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      <ol className="mb-8 flex gap-1.5" aria-label={t("setup.progress", { step: index + 1, total: steps.length })}>
        {steps.map((name, position) => (
          <li key={name} className={`h-1.5 flex-1 rounded-full ${position <= index ? "bg-accent" : "bg-line"}`} />
        ))}
      </ol>
      <h1 className="text-3xl leading-tight font-bold tracking-tight">{t(`setup.${step}.title`)}</h1>
      <p className="mt-2 mb-6 text-ink-soft">{t(`setup.${step}.intro`)}</p>
      <div className="flex-1">
        {StepBody && <StepBody draft={draft} change={(patch) => setDraft({ ...draft, ...patch })} />}
        {step === "summary" && targets && (
          <SetupSummary answers={draft as Answers} targets={targets}
            change={(patch) => setTargets({ ...targets, ...patch })} />
        )}
      </div>
      {failed && <p role="alert" className="mt-6 text-danger">{t("errors.save_failed")}</p>}
      <div className="mt-8 flex gap-3">
        {(index > 0 || onCancel) && (
          <Button variant="quiet" onClick={() => (index > 0 ? setIndex(index - 1) : onCancel?.())}>
            {t("common.back")}
          </Button>
        )}
        {step === "summary" ? (
          <Button className="flex-1" disabled={busy || !summaryValid} onClick={finish}>{t("setup.finish")}</Button>
        ) : (
          <Button className="flex-1" disabled={!stepDone(step, draft)} onClick={next}>{t("common.next")}</Button>
        )}
      </div>
    </main>
  );
}

function answersOf(profile: Profile): Draft {
  return {
    sex: profile.sex,
    birthYear: profile.birth_year,
    heightCm: profile.height_cm,
    startWeightKg: profile.start_weight_kg,
    goalWeightKg: profile.goal_weight_kg,
    activity: profile.activity,
    weeklyChangeKg: profile.weekly_change_kg || undefined,
  };
}

function profileOf(answers: Answers, targets: Targets): Profile {
  return {
    sex: answers.sex,
    birth_year: answers.birthYear,
    height_cm: answers.heightCm,
    start_weight_kg: answers.startWeightKg,
    goal_weight_kg: answers.goalWeightKg,
    activity: answers.activity,
    weekly_change_kg: answers.weeklyChangeKg,
    kcal_target: targets.kcal,
    protein_target: targets.protein,
    carbs_target: targets.carbs,
    fat_target: targets.fat,
  };
}
