import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { Trash2 } from "lucide-react";
import { errorCode } from "../api/client.ts";
import { useLoad } from "../api/use-load.ts";
import { formatDate, formatNumber } from "../locales/format.ts";
import type { Profile } from "../profile/profile.ts";
import { Button, NumberField } from "../ui/ui.tsx";
import { WeightChart } from "./WeightChart.tsx";
import { addWeight, deleteWeight, findWeights } from "./weights.ts";

/** Log a weighing, see the line towards the goal weight, fix mistakes. */
export function WeightScreen({ profile }: { profile: Profile }) {
  const { t } = useTranslation();
  const weights = useLoad(findWeights, "weights");
  const [kg, setKg] = useState<number>();
  const [error, setError] = useState<string>();
  const entries = weights.data ?? [];
  const latest = entries[entries.length - 1];

  async function run(action: () => Promise<unknown>) {
    setError(undefined);
    try {
      await action();
      weights.reload();
    } catch (failure) {
      setError(errorCode(failure));
    }
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    run(() => addWeight(kg!).then(() => setKg(undefined)));
  }

  const shownError = error ?? weights.error;

  return (
    <div>
      <h1 className="mb-6 text-lg font-semibold">{t("weight.title")}</h1>
      {latest && (
        <p className="mb-1 text-5xl font-extrabold tracking-tighter">
          {formatNumber(latest.kg, 1)} <span className="text-2xl font-semibold text-ink-soft">kg</span>
        </p>
      )}
      <p className="mb-4 text-ink-soft">{t("weight.goal", { kg: formatNumber(profile.goal_weight_kg, 1) })}</p>
      <WeightChart entries={entries} goalKg={profile.goal_weight_kg} />
      <form onSubmit={submit} className="mt-6 flex items-end gap-3">
        <NumberField className="flex-1" label={t("weight.today")} unit="kg" value={kg} onValue={setKg} />
        <Button type="submit" disabled={kg === undefined || kg < 30 || kg > 300}>{t("common.save")}</Button>
      </form>
      {shownError && <p role="alert" className="mt-3 text-danger">{t(`errors.${shownError}`, t("errors.unknown"))}</p>}
      <ul className="mt-8 divide-y divide-line">
        {[...entries].reverse().map((entry) => (
          <li key={entry.id} className="flex items-center justify-between py-2">
            <span className="text-ink-soft">{formatDate(new Date(entry.measured_at), { day: "numeric", month: "short", year: "numeric" })}</span>
            <span className="flex items-center gap-2">
              <span className="font-semibold">{formatNumber(entry.kg, 1)} kg</span>
              <button type="button" aria-label={t("weight.delete")} className="p-2 text-ink-soft"
                onClick={() => run(() => deleteWeight(entry.id))}>
                <Trash2 size={18} aria-hidden />
              </button>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
