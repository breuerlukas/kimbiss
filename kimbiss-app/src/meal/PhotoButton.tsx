import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Camera, Plus } from "lucide-react";
import { ApiError } from "../api/client.ts";
import { estimateMeal, type Estimate } from "./meals.ts";
import { photoToJpegBase64 } from "./photo.ts";

type PhotoButtonProps = { onEstimate: (estimate: Estimate) => void; onManual: () => void };

/**
 * The main action: the file input lets iOS offer camera or photo library
 * without any permission dance; the photo is shrunk and the api asked what
 * is on the plate. Manual entry sits right next to it.
 */
export function PhotoButton({ onEstimate, onManual }: PhotoButtonProps) {
  const { t, i18n } = useTranslation();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();

  async function estimate(file: File) {
    setBusy(true);
    setError(undefined);
    try {
      const result = await estimateMeal(await photoToJpegBase64(file), i18n.language);
      if (result.items.length === 0) {
        setError("no_food");
        return;
      }
      onEstimate(result);
    } catch (failure) {
      setError(failure instanceof ApiError ? failure.code : "network");
    } finally {
      setBusy(false);
      input.current!.value = "";
    }
  }

  return (
    <div>
      {error && <p role="alert" className="mb-2 text-center text-danger">{t(`errors.${error}`, t("errors.unknown"))}</p>}
      <div className="flex gap-3">
        <button type="button" disabled={busy} onClick={() => input.current?.click()}
          className="flex h-16 flex-1 items-center justify-center gap-3 rounded-2xl bg-accent text-lg font-bold text-accent-ink shadow-[0_4px_0_var(--ink)] transition active:translate-y-1 active:shadow-none disabled:opacity-70">
          <Camera aria-hidden className={busy ? "animate-pulse" : ""} />
          {t(busy ? "photo.looking" : "photo.take")}
        </button>
        <button type="button" onClick={onManual} aria-label={t("meal.add")}
          className="flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-ink bg-surface">
          <Plus aria-hidden />
        </button>
      </div>
      <input ref={input} type="file" accept="image/*" hidden
        onChange={(event) => event.target.files?.[0] && estimate(event.target.files[0])} />
    </div>
  );
}
