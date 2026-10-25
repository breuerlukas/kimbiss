import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Calculator, ChevronRight, LogOut } from "lucide-react";
import { api, session } from "../api/client.ts";
import { changeLanguage } from "../locales/i18n.ts";
import { formatNumber } from "../locales/format.ts";
import { Segmented, SectionHeader } from "../ui/ui.tsx";
import type { Profile } from "./profile.ts";

type ProfileScreenProps = { profile: Profile; onRerunSetup: () => void; onSignedOut: () => void };

/** The daily targets, the way back into the setup guide, language, sign out; laid out like Insulink's profile. */
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
    <div>
      <h1 className="mb-6 text-[22px] font-bold">{t("tabs.profile")}</h1>
      <SectionHeader title={t("profile.targets")} />
      <dl className="grid grid-cols-2 gap-2.5">
        {targets.map((target) => (
          <div key={target.key} className="rounded-[22px] border border-rim bg-surface px-4 py-3.5">
            <dt className="text-[13px] text-ink-soft">{t(`macros.${target.key}`)}</dt>
            <dd className="text-[28px] leading-tight font-extrabold tracking-[-0.03em]">
              {formatNumber(target.value)}<span className="ml-1 text-sm font-semibold tracking-normal text-ink-soft">{target.unit}</span>
            </dd>
          </div>
        ))}
      </dl>
      <div className="mt-2.5 rounded-[20px] border border-rim bg-surface">
        <ListRow icon={<Calculator size={20} aria-hidden />} label={t("profile.rerun_setup")} onClick={onRerunSetup} />
      </div>
      <section className="mt-9">
        <SectionHeader title={t("profile.language")} />
        <Segmented value={i18n.language} onChange={changeLanguage}
          options={[{ value: "de", label: "Deutsch" }, { value: "en", label: "English" }]} />
      </section>
      <div className="mt-9 rounded-[20px] border border-rim bg-surface">
        <ListRow danger icon={<LogOut size={20} aria-hidden />} label={t("profile.sign_out")} onClick={signOut} />
      </div>
    </div>
  );
}

type ListRowProps = { icon: ReactNode; label: string; onClick: () => void; danger?: boolean };

/** Insulink's list row: icon in a tinted disc, the label, a chevron; a dangerous one in red without. */
function ListRow({ icon, label, onClick, danger = false }: ListRowProps) {
  return (
    <button type="button" onClick={onClick}
      className={`flex min-h-[64px] w-full items-center gap-3.5 px-4 text-left font-bold ${danger ? "text-danger" : ""}`}>
      <span className={`flex size-10 shrink-0 items-center justify-center rounded-full ${danger ? "bg-danger-soft" : "bg-accent-soft text-accent"}`}>
        {icon}
      </span>
      <span className="flex-1">{label}</span>
      {!danger && <ChevronRight size={20} aria-hidden className="text-ink-soft" />}
    </button>
  );
}
