import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { formatNumber } from "../locales/format.ts";
import { Button, Field, numberText, parseNumber, Sheet } from "../ui/ui.tsx";
import { deleteMeal, saveMeal, type Estimate, type Meal } from "./meals.ts";

/** What the sheet opens with: an existing meal, a photo estimate, or nothing. */
export type MealDraft = { meal?: Meal; estimate?: Estimate };

type MealSheetProps = { draft: MealDraft | null; day: Date; onClose: () => void; onSaved: () => void };

export function MealSheet({ draft, day, onClose, onSaved }: MealSheetProps) {
  return (
    <Sheet open={draft !== null} onClose={onClose}>
      {draft && <MealForm key={draft.meal?.id ?? draft.estimate?.name ?? "new"}
        draft={draft} day={day} onClose={onClose} onSaved={onSaved} />}
    </Sheet>
  );
}

type Values = { name: string; time: string; kcal?: number; protein?: number; carbs?: number; fat?: number };
const NUTRIENTS = ["protein", "carbs", "fat"] as const;

/**
 * Edit form for one meal. A photo estimate arrives prefilled with its totals
 * and lists the foods it saw, so an odd number can be traced and corrected.
 */
function MealForm({ draft, day, onClose, onSaved }: Omit<MealSheetProps, "draft"> & { draft: MealDraft }) {
  const { t } = useTranslation();
  const [values, setValues] = useState<Values>(() => initialValues(draft));
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const change = (patch: Partial<Values>) => setValues({ ...values, ...patch });
  const valid = values.name.trim() !== "" && values.kcal !== undefined;

  async function run(action: () => Promise<unknown>) {
    setBusy(true);
    setFailed(false);
    try {
      await action();
      onSaved();
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    run(() => saveMeal({
      name: values.name.trim(),
      eaten_at: timeOnDay(draft.meal ? new Date(draft.meal.eaten_at) : day, values.time),
      kcal: values.kcal ?? 0,
      protein: values.protein ?? 0,
      carbs: values.carbs ?? 0,
      fat: values.fat ?? 0,
    }, draft.meal?.id));
  }

  return (
    <form onSubmit={submit} className="grid gap-4">
      <h2 className="text-2xl font-bold">{t(draft.meal ? "meal.edit" : "meal.add")}</h2>
      {draft.estimate && <EstimateItems estimate={draft.estimate} />}
      <div className="grid grid-cols-[1fr_7rem] gap-3">
        <Field label={t("meal.name")} value={values.name} onChange={(event) => change({ name: event.target.value })} maxLength={120} />
        <Field label={t("meal.time")} type="time" value={values.time} onChange={(event) => change({ time: event.target.value })} />
      </div>
      <Field label={t("meal.kcal")} unit="kcal" inputMode="decimal" value={numberText(values.kcal)}
        onChange={(event) => change({ kcal: parseNumber(event.target.value) })} />
      <div className="grid grid-cols-3 gap-3">
        {NUTRIENTS.map((nutrient) => (
          <Field key={nutrient} label={t(`macros.${nutrient}`)} unit="g" inputMode="decimal"
            value={numberText(values[nutrient])}
            onChange={(event) => change({ [nutrient]: parseNumber(event.target.value) })} />
        ))}
      </div>
      {failed && <p role="alert" className="text-danger">{t("errors.save_failed")}</p>}
      <div className="flex gap-3">
        <Button type="button" variant="quiet" onClick={onClose}>{t("common.cancel")}</Button>
        <Button type="submit" className="flex-1" disabled={busy || !valid}>{t("common.save")}</Button>
      </div>
      {draft.meal && (
        <Button type="button" variant="danger" disabled={busy} onClick={() => run(() => deleteMeal(draft.meal!.id))}>
          {t("meal.delete")}
        </Button>
      )}
    </form>
  );
}

function EstimateItems({ estimate }: { estimate: Estimate }) {
  const { t } = useTranslation();
  return (
    <div className="rounded-2xl bg-surface p-4">
      <p className="mb-2 text-sm text-ink-soft">{t("meal.recognized")}</p>
      <ul className="grid gap-1">
        {estimate.items.map((item, position) => (
          <li key={position} className="flex justify-between gap-3">
            <span>{item.name} <span className="text-ink-soft">{formatNumber(item.grams)} g</span></span>
            <span className="font-semibold">{formatNumber(item.kcal)}</span>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-sm text-ink-soft">{t("meal.estimate_hint")}</p>
    </div>
  );
}

function initialValues({ meal, estimate }: MealDraft): Values {
  const source = meal ?? estimate;
  const time = new Date(meal?.eaten_at ?? Date.now()).toTimeString().slice(0, 5);
  if (!source) {
    return { name: "", time };
  }
  return {
    name: source.name,
    time,
    kcal: Math.round(source.kcal),
    protein: Math.round(source.protein),
    carbs: Math.round(source.carbs),
    fat: Math.round(source.fat),
  };
}

/** Epoch milliseconds of `time` (HH:MM) on the local day of `day`. */
function timeOnDay(day: Date, time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return new Date(day.getFullYear(), day.getMonth(), day.getDate(), hours || 0, minutes || 0).getTime();
}
