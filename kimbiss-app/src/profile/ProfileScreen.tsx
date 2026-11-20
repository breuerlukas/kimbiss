import { useTranslation } from "react-i18next";
import { Calculator, ChevronRight, LogOut } from "lucide-react";
import { api, session } from "../api/client.ts";
import { changeLanguage } from "../locales/i18n.ts";
import { formatNumber } from "../locales/format.ts";
import { MACROS, MacroCard, Segmented, SectionHeader } from "../ui/ui.tsx";
import type { Profile } from "./profile.ts";

type ProfileScreenProps = { profile: Profile; onRerunSetup: () => void; onSignedOut: () => void };

/** The daily targets with their split of the energy, the way back into the setup guide, language, sign out. */
export function ProfileScreen({ profile, onRerunSetup, onSignedOut }: ProfileScreenProps) {
  const { t, i18n } = useTranslation();
  const energy = MACROS.reduce((total, macro) => total + profile[`${macro.key}_target`] * macro.kcalPerGram, 0);
  const share = (macro: (typeof MACROS)[number]) => energy ? Math.round(profile[`${macro.key}_target`] * macro.kcalPerGram / energy * 100) : 0;

  async function signOut() {
    await api("DELETE", "/session").catch(() => undefined);
    session.clear();
    onSignedOut();
  }

  return (
    <div>
      <header className="flex flex-col gap-0.5">
        <span className="eyebrow">{t("profile.overline")}</span>
        <h1 className="font-display text-[28px] leading-tight font-bold tracking-[-0.02em]">{t("tabs.profile")}</h1>
      </header>
      <section className="mt-7">
        <SectionHeader title={t("profile.targets")} />
        <div className="flex flex-col gap-3.5 rounded-3xl border border-rim bg-surface p-[18px]">
          <p className="flex items-start justify-between gap-3">
            <span className="text-[13px] font-medium text-ink-soft">{t("macros.kcal")}</span>
            <span className="font-mono text-[11px] text-ink-soft uppercase">{t("profile.per_day")}</span>
          </p>
          <p className="flex items-baseline gap-1.5 font-display">
            <span className="text-[56px] leading-[0.9] font-extrabold tracking-[-0.04em]">{formatNumber(profile.kcal_target)}</span>
            <span className="text-lg font-medium text-ink-soft">kcal</span>
          </p>
          <div role="img" className="flex h-2.5 gap-[3px]"
            aria-label={t("profile.split_label", { protein: share(MACROS[0]), carbs: share(MACROS[1]), fat: share(MACROS[2]) })}>
            {MACROS.map((macro) => <span key={macro.key} className={`rounded-full ${macro.bar}`} style={{ width: `${share(macro)}%` }} />)}
          </div>
        </div>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {MACROS.map((macro) => (
            <MacroCard key={macro.key} macro={macro} value={formatNumber(profile[`${macro.key}_target`])} unit="g"
              footer={t("profile.energy_share", { percent: share(macro) })} />
          ))}
        </div>
        <button type="button" onClick={onRerunSetup}
          className="mt-2 flex h-16 w-full items-center gap-3 rounded-[20px] border border-rim bg-surface px-3 text-left">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent"><Calculator size={20} aria-hidden /></span>
          <span className="flex-1 text-[15px] font-semibold">{t("profile.rerun_setup")}</span>
          <ChevronRight size={20} aria-hidden className="text-ink-soft" />
        </button>
      </section>
      <section className="mt-7">
        <SectionHeader title={t("profile.language")} />
        <Segmented label={t("profile.language")} value={i18n.language} onChange={changeLanguage}
          options={[{ value: "de", label: "Deutsch" }, { value: "en", label: "English" }]} />
      </section>
      <button type="button" onClick={signOut}
        className="mt-7 flex h-14 w-full items-center gap-3 rounded-[20px] border border-danger/18 bg-danger-soft px-3 text-[15px] font-semibold text-danger">
        <LogOut size={20} aria-hidden />{t("profile.sign_out")}
      </button>
    </div>
  );
}
