import { useEffect, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { Trash2 } from "lucide-react";
import { errorCode } from "../api/client.ts";
import { formatDate } from "../locales/format.ts";
import { Button, Sheet } from "../ui/ui.tsx";
import { EstimateItems, MealHeader, NutrientStrip, type Nutrient } from "./MealParts.tsx";
import { deleteMeal, findMealPhoto, saveMeal, type Estimate, type Meal } from "./meals.ts";

/**
 * What the sheet opens with: an existing meal, a photo estimate (its photo as
 * object URL to show and as base64 JPEG to save), or nothing.
 */
export type MealDraft = { meal?: Meal; estimate?: Estimate; photoUrl?: string; photo?: string };

type MealSheetProps = { draft: MealDraft | null; day: Date; onClose: () => void; onSaved: () => void };

export function MealSheet({ draft, day, onClose, onSaved }: MealSheetProps) {
  return (
    <Sheet open={draft !== null} onClose={onClose}>
      {draft && <MealForm key={draft.meal?.id ?? draft.photoUrl ?? "new"}
        draft={draft} day={day} onClose={onClose} onSaved={onSaved} />}
    </Sheet>
  );
}

type Values = { name: string; time: string } & Partial<Record<Nutrient, number>>;

/**
 * One meal in Insulink's meal-detail look: the photo on top when there is
 * one, the name and time, the nutrient strip, and the foods the photo showed,
 * so an odd number can be traced and corrected before saving. A saved meal
 * shows its stored photo and foods again.
 */
function MealForm({ draft, day, onClose, onSaved }: Omit<MealSheetProps, "draft"> & { draft: MealDraft }) {
  const { t } = useTranslation();
  const [values, setValues] = useState<Values>(() => initialValues(draft));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const savedPhotoUrl = useSavedPhoto(draft.meal);
  const photoUrl = draft.photoUrl ?? savedPhotoUrl ?? undefined;
  const items = draft.estimate?.items ?? draft.meal?.items ?? [];
  const change = (patch: Partial<Values>) => setValues({ ...values, ...patch });
  const valid = values.name.trim() !== "" && values.kcal !== undefined;

  async function run(action: () => Promise<unknown>) {
    setBusy(true);
    setError(undefined);
    try {
      await action();
      onSaved();
    } catch (failure) {
      setError(errorCode(failure));
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
      items,
      photo: draft.photo,
    }, draft.meal?.id));
  }

  return (
    <form onSubmit={submit} className="grid gap-5">
      <MealHeader name={values.name} day={dayLabel(draft.meal ? new Date(draft.meal.eaten_at) : day, t("today.title"))}
        time={values.time} onClose={onClose}
        onName={(name) => change({ name })} onTime={(time) => change({ time })} />
      {draft.meal?.has_photo && savedPhotoUrl === undefined && <div className="aspect-[4/3] w-full animate-pulse rounded-[20px] bg-line" />}
      {photoUrl && <img src={photoUrl} alt="" className="aspect-[4/3] w-full rounded-[20px] object-cover" />}
      <NutrientStrip values={values} onChange={(nutrient, value) => change({ [nutrient]: value })} />
      {items.length > 0 && <EstimateItems items={items} fresh={draft.estimate !== undefined} />}
      {error && <p role="alert" className="rounded-2xl bg-danger-soft px-4 py-3 font-semibold text-danger">{t(`errors.${error}`, t("errors.save_failed"))}</p>}
      <Button type="submit" disabled={busy || !valid}>{t("common.save")}</Button>
      {draft.meal && (
        <button type="button" disabled={busy} onClick={() => run(() => deleteMeal(draft.meal!.id))}
          className="-mt-1 flex h-11 items-center justify-center gap-2 font-bold text-danger">
          <Trash2 size={20} aria-hidden />{t("meal.delete")}
        </button>
      )}
    </form>
  );
}

/**
 * The stored photo of a saved meal as an object URL, freed when the sheet
 * closes: undefined while it loads, null when it could not.
 */
function useSavedPhoto(meal?: Meal) {
  const [url, setUrl] = useState<string | null>();
  useEffect(() => {
    if (!meal?.has_photo) {
      return;
    }
    let shown: string | undefined;
    let closed = false;
    findMealPhoto(meal.id).then((found) => {
      if (closed) {
        URL.revokeObjectURL(found);
      } else {
        shown = found;
        setUrl(found);
      }
    }, () => !closed && setUrl(null));
    return () => {
      closed = true;
      if (shown) {
        URL.revokeObjectURL(shown);
      }
    };
  }, [meal?.id, meal?.has_photo]);
  return url;
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

/** "Heute" for today, else the short date ("Sa., 24. Okt."). */
function dayLabel(date: Date, today: string): string {
  return date.toDateString() === new Date().toDateString() ? today
    : formatDate(date, { weekday: "short", day: "numeric", month: "short" });
}

/** Epoch milliseconds of `time` (HH:MM) on the local day of `day`. */
function timeOnDay(day: Date, time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return new Date(day.getFullYear(), day.getMonth(), day.getDate(), hours || 0, minutes || 0).getTime();
}
