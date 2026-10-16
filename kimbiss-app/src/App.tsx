import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ChartLine, ReceiptText, UserRound } from "lucide-react";
import { session } from "./api/client.ts";
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
 * guide. Otherwise the three tabs.
 */
export function App() {
  const { t } = useTranslation();
  const [signedIn, setSignedIn] = useState(() => session.token() !== null);
  const [profile, setProfile] = useState<Profile | null>();
  const [rerunSetup, setRerunSetup] = useState(false);
  const [tab, setTab] = useState<Tab>("today");
  const [loadFailed, setLoadFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => session.onSignedOut(() => setSignedIn(false)), []);
  useEffect(() => {
    setProfile(undefined);
    setLoadFailed(false);
    if (signedIn) {
      findProfile().then(setProfile, () => setLoadFailed(true));
    }
  }, [signedIn, attempt]);

  if (!signedIn) {
    return <AuthScreen onSignedIn={() => setSignedIn(true)} />;
  }
  if (loadFailed) {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
        <p>{t("errors.load_failed")}</p>
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
        {tab === "today" && <TodayScreen profile={profile} />}
        {tab === "weight" && <WeightScreen profile={profile} />}
        {tab === "profile" && (
          <ProfileScreen profile={profile} onRerunSetup={() => setRerunSetup(true)} onSignedOut={() => setSignedIn(false)} />
        )}
      </main>
      <nav className="fixed inset-x-0 bottom-0 border-t border-line bg-paper/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
        <ul className="mx-auto flex max-w-lg">
          {TABS.map(({ id, icon: Icon }) => (
            <li key={id} className="flex-1">
              <button type="button" onClick={() => setTab(id)} aria-current={tab === id ? "page" : undefined}
                className={`flex h-16 w-full flex-col items-center justify-center gap-0.5 text-xs ${tab === id ? "font-semibold text-ink" : "text-ink-soft"}`}>
                <Icon size={22} aria-hidden strokeWidth={tab === id ? 2.5 : 2} />
                {t(`tabs.${id}`)}
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}
