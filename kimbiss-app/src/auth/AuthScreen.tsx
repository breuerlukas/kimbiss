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
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-6 py-10">
      <h1 className="text-6xl font-extrabold tracking-tight">Kimbiss</h1>
      <p className="mt-2 mb-10 text-lg text-ink-soft">{t("auth.tagline")}</p>
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
        {error && <p role="alert" className="text-danger">{t(`errors.${error}`, t("errors.unknown"))}</p>}
        <Button type="submit" disabled={busy} className="mt-2">{t(`auth.${mode}`)}</Button>
      </form>
      <button type="button" className="mt-6 text-ink-soft underline underline-offset-4"
        onClick={() => setMode(mode === "signin" ? "signup" : "signin")}>
        {t(mode === "signin" ? "auth.to_signup" : "auth.to_signin")}
      </button>
    </main>
  );
}
