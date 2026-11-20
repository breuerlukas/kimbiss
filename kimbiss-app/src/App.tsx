import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ChartLine, ReceiptText, UserRound } from "lucide-react";
import { errorCode, session } from "./api/client.ts";
import { AuthScreen } from "./auth/AuthScreen.tsx";
import { findProfile, type Profile } from "./profile/profile.ts";
import { ProfileScreen } from "./profile/ProfileScreen.tsx";
import { SetupGuide } from "./setup/SetupGuide.tsx";
import type { MealDraft } from "./meal/MealSheet.tsx";
import { PhotoButton } from "./meal/PhotoButton.tsx";
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
 * guide. Otherwise the three tabs, switched in the floating navigation, with
 * the camera button beside it on every tab. A photo's meal opens on today.
 */
export function App() {
  const { t } = useTranslation();
  const [signedIn, setSignedIn] = useState(() => session.token() !== null);
  const [profile, setProfile] = useState<Profile | null>();
  const [rerunSetup, setRerunSetup] = useState(false);
  const [tab, setTab] = useState<Tab>("today");
  const [loadError, setLoadError] = useState<string>();
  const [attempt, setAttempt] = useState(0);
  const [camera, setCamera] = useState(false);
  /** The meal sheet's content; here so a photo taken on any tab lands on today. */
  const [draft, setDraft] = useState<MealDraft | null>(null);

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
      <main className="mx-auto max-w-lg px-5 pt-[max(1.75rem,env(safe-area-inset-top))] pb-[calc(8rem+env(safe-area-inset-bottom))]">
        {tab === "today" && <TodayScreen profile={profile} draft={draft} setDraft={setDraft} onTakePhoto={() => setCamera(true)} />}
        {tab === "weight" && <WeightScreen profile={profile} />}
        {tab === "profile" && (
          <ProfileScreen profile={profile} onRerunSetup={() => setRerunSetup(true)} onSignedOut={() => setSignedIn(false)} />
        )}
      </main>
      <div className="fixed inset-x-0 bottom-[max(1.5rem,env(safe-area-inset-bottom))] mx-auto flex max-w-lg items-center gap-2.5 px-4">
        <nav aria-label={t("tabs.label")}
          className="h-16 min-w-0 flex-1 rounded-full border border-rim-strong bg-dock p-1.5 shadow-[0_12px_32px_rgb(0_0_0/0.4)] backdrop-blur-md">
          <ul className="flex h-full gap-1">
            {TABS.map(({ id, icon: Icon }) => (
              <li key={id} className={tab === id ? "min-w-0 flex-[1.6]" : "min-w-0 flex-1"}>
                <button type="button" onClick={() => setTab(id)} aria-current={tab === id ? "page" : undefined}
                  aria-label={t(`tabs.${id}`)}
                  className={`flex h-full w-full items-center justify-center gap-2 rounded-full text-sm font-semibold transition-colors ${tab === id ? "bg-accent-soft text-accent" : "text-ink-soft"}`}>
                  <Icon size={20} aria-hidden className="shrink-0" />
                  {tab === id && <span className="truncate">{t(`tabs.${id}`)}</span>}
                </button>
              </li>
            ))}
          </ul>
        </nav>
        <PhotoButton camera={camera} setCamera={setCamera}
          onEstimate={(estimate, photoUrl, photo) => {
            setTab("today");
            setDraft({ estimate, photoUrl, photo });
          }} />
      </div>
    </>
  );
}
