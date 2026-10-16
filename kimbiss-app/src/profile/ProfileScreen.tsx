import { useTranslation } from "react-i18next";
import { api, session } from "../api/client.ts";
import { changeLanguage } from "../locales/i18n.ts";
import { formatNumber } from "../locales/format.ts";
import { Button, Choice } from "../ui/ui.tsx";
import type { Profile } from "./profile.ts";

type ProfileScreenProps = { profile: Profile; onRerunSetup: () => void; onSignedOut: () => void };

/** The daily targets, the way back into the setup guide, language, sign out. */
export function ProfileScreen({ profile, onRerunSetup, onSignedOut }: ProfileScreenProps) {
  const { t, i18n } = useTranslation();
  const targets = [
    { key: "kcal", value: profile.kcal_target, unit: "kcal" },
    { key: "protein", value: profile.protein_target, unit: "g" },
    { key: "carbs", value: profile.carbs_target, unit: "g" },
    { key: "fat", value: profile.fat_target, unit: "g" },
  ];

  async function signOut() {
    await api("DELETE", "/session").catch(() => undefined);
    session.clear();
    onSignedOut();
  }

  return (
    <div className="grid gap-8">
      <section>
        <h1 className="mb-4 text-lg font-semibold">{t("profile.targets")}</h1>
        <dl className="grid grid-cols-2 gap-3">
          {targets.map((target) => (
            <div key={target.key} className="rounded-2xl bg-surface p-4">
              <dt className="text-sm text-ink-soft">{t(`macros.${target.key}`)}</dt>
              <dd className="text-2xl font-bold">{formatNumber(target.value)} <span className="text-base font-normal text-ink-soft">{target.unit}</span></dd>
            </div>
          ))}
        </dl>
        <Button variant="quiet" className="mt-4 w-full" onClick={onRerunSetup}>{t("profile.rerun_setup")}</Button>
      </section>
      <section>
        <h2 className="mb-4 text-lg font-semibold">{t("profile.language")}</h2>
        <Choice value={i18n.language} onChange={changeLanguage}
          options={[{ value: "de", label: "Deutsch" }, { value: "en", label: "English" }]} />
      </section>
      <Button variant="danger" onClick={signOut}>{t("profile.sign_out")}</Button>
    </div>
  );
}
