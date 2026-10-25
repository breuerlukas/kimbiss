import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ChartLine, ReceiptText, UserRound } from "lucide-react";
import { errorCode, session } from "./api/client.ts";
import { AuthScreen } from "./auth/AuthScreen.tsx";
import { findProfile, type Profile } from "./profile/profile.ts";
import { ProfileScreen } from "./profile/ProfileScreen.tsx";
import { SetupGuide } from "./setup/SetupGuide.tsx";
import { Button } from "./ui/ui.tsx";
import { TodayScreen } from "./today/TodayScreen.tsx";
import { WeightScreen } from "./weight/WeightScreen.tsx";

type Tab = "today" | "weight" | "profile";
const TABS = [
  { id: "today", icon: ReceiptText },
  { id: "weight", icon: ChartLine },
  { id: "profile", icon: UserRound },
] as const;

/**
 * Signed out: sign-in. Signed in without a profile, or rerunning it: the setup
 * guide. Otherwise the three tabs, switched in Insulink's floating dock; the
 * today tab puts its camera button into the slot beside it.
 */
export function App() {
  const { t } = useTranslation();
  const [signedIn, setSignedIn] = useState(() => session.token() !== null);
  const [profile, setProfile] = useState<Profile | null>();
  const [rerunSetup, setRerunSetup] = useState(false);
  const [tab, setTab] = useState<Tab>("today");
  const [loadError, setLoadError] = useState<string>();
  const [attempt, setAttempt] = useState(0);
  const [dockAction, setDockAction] = useState<HTMLElement | null>(null);

  useEffect(() => session.onSignedOut(() => setSignedIn(false)), []);
  useEffect(() => {
    setProfile(undefined);
    setLoadError(undefined);
    if (signedIn) {
      findProfile().then(setProfile, (failure) => setLoadError(errorCode(failure)));
    }
  }, [signedIn, attempt]);

  if (!signedIn) {
    return <AuthScreen onSignedIn={() => setSignedIn(true)} />;
  }
  if (loadError) {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
        <p>{t(`errors.${loadError}`, t("errors.load_failed"))}</p>
        <Button variant="quiet" onClick={() => setAttempt(attempt + 1)}>{t("common.retry")}</Button>
      </main>
    );
  }
  if (profile === undefined) {
    return null;
  }
  if (profile === null || rerunSetup) {
    return (
      <SetupGuide previous={profile} onCancel={rerunSetup ? () => setRerunSetup(false) : undefined}
        onDone={(saved) => {
          setProfile(saved);
          setRerunSetup(false);
        }} />
    );
  }
  return (
    <>
      <main className="mx-auto max-w-lg px-5 pt-[max(1.25rem,env(safe-area-inset-top))] pb-[calc(6rem+env(safe-area-inset-bottom))]">
        {tab === "today" && <TodayScreen profile={profile} dockAction={dockAction} />}
        {tab === "weight" && <WeightScreen profile={profile} />}
        {tab === "profile" && (
          <ProfileScreen profile={profile} onRerunSetup={() => setRerunSetup(true)} onSignedOut={() => setSignedIn(false)} />
        )}
      </main>
      <div className="pointer-events-none fixed inset-x-0 bottom-0 bg-linear-to-t from-paper via-paper/80 to-transparent pt-6">
        <div className="pointer-events-auto mx-auto flex max-w-lg items-center gap-3 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <nav className="h-[62px] flex-1 rounded-[31px] border border-rim bg-dock p-[7px] shadow-[0_8px_24px_rgb(29_21_38/0.14)]">
            <ul className="flex h-full gap-1">
              {TABS.map(({ id, icon: Icon }) => (
                <li key={id} className={tab === id ? "flex-[2.2]" : "flex-1"}>
                  <button type="button" onClick={() => setTab(id)} aria-current={tab === id ? "page" : undefined}
                    aria-label={t(`tabs.${id}`)}
                    className={`flex h-full w-full items-center justify-center gap-2 rounded-full font-bold transition-colors ${tab === id ? "bg-accent-soft text-accent-text" : "text-ink-soft"}`}>
                    <Icon size={22} aria-hidden strokeWidth={tab === id ? 2.4 : 2} />
                    {tab === id && <span className="truncate">{t(`tabs.${id}`)}</span>}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
          <div ref={setDockAction} className="empty:hidden" />
        </div>
      </div>
    </>
  );
}
