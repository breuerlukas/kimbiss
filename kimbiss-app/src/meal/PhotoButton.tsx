import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { Camera, Image, Plus } from "lucide-react";
import { ApiError } from "../api/client.ts";
import { AnalysingOverlay } from "./AnalysingOverlay.tsx";
import { estimateMeal, type Estimate } from "./meals.ts";
import { photoToJpegBase64 } from "./photo.ts";

type PhotoButtonProps = { onEstimate: (estimate: Estimate, photoUrl: string) => void; onManual: () => void };

/**
 * The main action opens the camera straight away (`capture`; without it
 * Android opens the gallery). A photo taken earlier comes from the gallery
 * button, a meal without photo from the plus. Either photo is shrunk and the
 * api asked what is on the plate.
 */
export function PhotoButton({ onEstimate, onManual }: PhotoButtonProps) {
  const { t, i18n } = useTranslation();
  const cameraInput = useRef<HTMLInputElement>(null);
  const galleryInput = useRef<HTMLInputElement>(null);
  const [photoUrl, setPhotoUrl] = useState<string>();
  const busy = photoUrl !== undefined;
  const [error, setError] = useState<string>();

  async function estimate(input: HTMLInputElement) {
    const file = input.files?.[0];
    if (!file) {
      return;
    }
    const url = URL.createObjectURL(file);
    let keepPhoto = false;
    setPhotoUrl(url);
    setError(undefined);
    try {
      const result = await estimateMeal(await photoToJpegBase64(file), i18n.language);
      if (result.items.length === 0) {
        setError("no_food");
        return;
      }
      onEstimate(result, url);
      keepPhoto = true;
    } catch (failure) {
      setError(failure instanceof ApiError ? failure.code : "network");
    } finally {
      if (!keepPhoto) {
        URL.revokeObjectURL(url);
      }
      setPhotoUrl(undefined);
      input.value = "";
    }
  }

  return (
    <div>
      {photoUrl && createPortal(<AnalysingOverlay photoUrl={photoUrl} />, document.body)}
      {error && <p role="alert" className="mb-2 text-center text-danger">{t(`errors.${error}`, t("errors.unknown"))}</p>}
      <div className="flex gap-3">
        <button type="button" disabled={busy} onClick={() => cameraInput.current?.click()}
          className="flex h-16 min-w-0 flex-1 items-center justify-center gap-2 rounded-2xl bg-accent text-base font-bold text-accent-ink transition active:scale-[0.98] active:brightness-95 disabled:opacity-70">
          <Camera aria-hidden className="shrink-0" />
          <span className="truncate">{t("photo.take")}</span>
        </button>
        <SideButton label={t("photo.gallery")} disabled={busy} onClick={() => galleryInput.current?.click()}>
          <Image aria-hidden />
        </SideButton>
        <SideButton label={t("meal.add")} onClick={onManual}>
          <Plus aria-hidden />
        </SideButton>
      </div>
      <input ref={cameraInput} type="file" accept="image/*" capture="environment" hidden
        onChange={(event) => estimate(event.target)} />
      <input ref={galleryInput} type="file" accept="image/*" hidden
        onChange={(event) => estimate(event.target)} />
    </div>
  );
}

type SideButtonProps = { label: string; onClick: () => void; disabled?: boolean; children: React.ReactNode };

function SideButton({ label, onClick, disabled, children }: SideButtonProps) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} aria-label={label}
      className="flex h-16 w-14 shrink-0 items-center justify-center rounded-2xl border-2 border-ink bg-surface disabled:opacity-50">
      {children}
    </button>
  );
}
