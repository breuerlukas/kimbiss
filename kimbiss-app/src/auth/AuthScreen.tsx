import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { api, errorCode, session } from "../api/client.ts";
import { Button, Field } from "../ui/ui.tsx";

type Mode = "signin" | "signup";

/** Sign in, or sign up with the invite code the server was started with. */
export function AuthScreen({ onSignedIn }: { onSignedIn: () => void }) {
  const { t } = useTranslation();
  const [mode, setMode] = useState<Mode>("signin");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(undefined);
    try {
      const body = { name: name.trim(), password, invite_code: inviteCode.trim() };
      const { token } = await api<{ token: string }>("POST", `/auth/${mode}`, body);
      session.save(token);
      onSignedIn();
    } catch (failure) {
      setError(errorCode(failure));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col px-6 pt-[max(2.5rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      <div className="flex flex-1 flex-col justify-center">
        <img src="/favicon.svg" alt="" className="mx-auto size-16" />
        <h1 className="mt-5 text-center text-5xl font-extrabold tracking-[-0.04em]">Kimbiss</h1>
        <p className="mt-2 mb-9 text-center text-ink-soft">{t("auth.tagline")}</p>
        <form onSubmit={submit} className="grid gap-4">
          <Field label={t("auth.name")} value={name} onChange={(event) => setName(event.target.value)}
            autoComplete="username" autoCapitalize="none" required minLength={3} />
          <Field label={t("auth.password")} type="password" value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete={mode === "signin" ? "current-password" : "new-password"} required minLength={8} />
          {mode === "signup" && (
            <Field label={t("auth.invite_code")} value={inviteCode}
              onChange={(event) => setInviteCode(event.target.value)} autoCapitalize="none" required />
          )}
          {error && <p role="alert" className="rounded-2xl bg-danger-soft px-4 py-3 font-semibold text-danger">{t(`errors.${error}`, t("errors.unknown"))}</p>}
          <Button type="submit" disabled={busy} className="mt-2">{t(`auth.${mode}`)}</Button>
        </form>
      </div>
      <p className="mt-8 text-center text-ink-soft">
        {t(mode === "signin" ? "auth.signup_question" : "auth.signin_question")}{" "}
        <button type="button" className="font-bold text-accent-text"
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}>
          {t(mode === "signin" ? "auth.signup_action" : "auth.signin_action")}
        </button>
      </p>
    </main>
  );
}
