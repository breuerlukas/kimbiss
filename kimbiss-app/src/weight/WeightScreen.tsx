import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { ArrowDown, ArrowUp, Trash2 } from "lucide-react";
import { errorCode } from "../api/client.ts";
import { useLoad } from "../api/use-load.ts";
import { formatDate, formatNumber } from "../locales/format.ts";
import type { Profile } from "../profile/profile.ts";
import { Button, NumberField, SectionHeader } from "../ui/ui.tsx";
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

  const listed = [...entries].reverse();

  return (
    <div>
      <h1 className="mb-6 text-[22px] font-bold">{t("weight.title")}</h1>
      {latest && (
        <p className="text-[72px] leading-[0.85] font-extrabold tracking-[-0.045em]">
          {formatNumber(latest.kg, 1)}<span className="ml-2 text-xl font-semibold tracking-normal text-ink-soft">kg</span>
        </p>
      )}
      <p className="mt-3 mb-5 text-ink-soft">{t("weight.goal", { kg: formatNumber(profile.goal_weight_kg, 1) })}</p>
      <div className="rounded-[20px] border border-rim bg-surface p-4">
        <WeightChart entries={entries} goalKg={profile.goal_weight_kg} />
      </div>
      <form onSubmit={submit} className="mt-4 flex items-end gap-3">
        <NumberField className="flex-1" label={t("weight.today")} unit="kg" value={kg} onValue={setKg} />
        <Button type="submit" disabled={kg === undefined || kg < 30 || kg > 300}>{t("common.save")}</Button>
      </form>
      {shownError && <p role="alert" className="mt-3 rounded-2xl bg-danger-soft px-4 py-3 font-semibold text-danger">{t(`errors.${shownError}`, t("errors.unknown"))}</p>}
      {listed.length > 0 && (
        <section className="mt-9">
          <SectionHeader title={t("weight.history")} />
          <ul className="divide-y divide-line rounded-[20px] border border-rim bg-surface">
            {listed.map((entry, position) => (
              <li key={entry.id} className="flex min-h-[64px] items-center gap-3 py-2 pr-1.5 pl-4">
                <span className="min-w-0 flex-1">
                  <span className="block font-bold">{formatNumber(entry.kg, 1)} kg</span>
                  <span className="block text-[13px] text-ink-soft">
                    {formatDate(new Date(entry.measured_at), { weekday: "short", day: "numeric", month: "short" })}
                  </span>
                </span>
                {listed[position + 1] && <Change kg={entry.kg - listed[position + 1].kg} towardGoal={
                  Math.abs(profile.goal_weight_kg - entry.kg) <= Math.abs(profile.goal_weight_kg - listed[position + 1].kg)} />}
                <button type="button" aria-label={t("weight.delete")}
                  className="flex size-11 items-center justify-center rounded-full text-ink-soft active:bg-line"
                  onClick={() => run(() => deleteWeight(entry.id))}>
                  <Trash2 size={18} aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

/** The change since the weighing before, as Insulink's pill: green toward the goal, amber away from it. */
function Change({ kg, towardGoal }: { kg: number; towardGoal: boolean }) {
  const Arrow = kg < 0 ? ArrowDown : ArrowUp;
  return (
    <span className={`flex h-8 items-center gap-1 rounded-full px-2.5 text-sm font-bold ${
      towardGoal ? "bg-fat/15 text-fat" : "bg-carbs/15 text-carbs"}`}>
      <Arrow size={14} strokeWidth={3} aria-hidden />{formatNumber(Math.abs(kg), 1)} kg
    </span>
  );
}
