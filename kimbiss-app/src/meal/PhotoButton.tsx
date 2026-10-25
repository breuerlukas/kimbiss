import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { Camera, Image, Plus } from "lucide-react";
import { errorCode } from "../api/client.ts";
import { AnalysingOverlay } from "./AnalysingOverlay.tsx";
import { MealCamera } from "./MealCamera.tsx";
import { estimateMeal, type Estimate } from "./meals.ts";
import { photoToJpegBase64 } from "./photo.ts";

type PhotoButtonProps = { onEstimate: (estimate: Estimate, photoUrl: string, photo: string) => void; onManual: () => void };

/**
 * The main action opens Kimbiss' own camera ({@link MealCamera}); where it
 * cannot open, the system camera (`capture`; without it Android opens the
 * gallery). A photo taken earlier comes from the gallery, a meal without photo
 * from the plus. Either photo is shrunk and the api asked what is on the
 * plate. A failed try shows its error in the camera, if it is open, else here.
 */
export function PhotoButton({ onEstimate, onManual }: PhotoButtonProps) {
  const { t, i18n } = useTranslation();
  const cameraInput = useRef<HTMLInputElement>(null);
  const galleryInput = useRef<HTMLInputElement>(null);
  const [photoUrl, setPhotoUrl] = useState<string>();
  const busy = photoUrl !== undefined;
  const [error, setError] = useState<string>();
  const [camera, setCamera] = useState(false);

  function closeCamera() {
    setCamera(false);
    setError(undefined);
  }

  async function estimateFile(input: HTMLInputElement) {
    const file = input.files?.[0];
    input.value = "";
    if (file) {
      await estimate(file);
    }
  }

  async function estimate(file: Blob) {
    const url = URL.createObjectURL(file);
    let keepPhoto = false;
    setPhotoUrl(url);
    setError(undefined);
    try {
      const photo = await photoToJpegBase64(file);
      const result = await estimateMeal(photo, i18n.language);
      if (result.items.length === 0) {
        setError("no_food");
        return;
      }
      onEstimate(result, url, photo);
      keepPhoto = true;
      setCamera(false);
    } catch (failure) {
      setError(errorCode(failure));
    } finally {
      if (!keepPhoto) {
        URL.revokeObjectURL(url);
      }
      setPhotoUrl(undefined);
    }
  }

  return (
    <div>
      {camera && createPortal(
        <MealCamera error={error} onShot={estimate} onClose={closeCamera}
          onGallery={() => galleryInput.current?.click()}
          onCameraApp={() => {
            closeCamera();
            cameraInput.current?.click();
          }} />,
        document.body,
      )}
      {photoUrl && createPortal(<AnalysingOverlay photoUrl={photoUrl} />, document.body)}
      {error && !camera && <p role="alert" className="mb-2 text-center text-danger">{t(`errors.${error}`, t("errors.unknown"))}</p>}
      <div className="flex gap-3">
        <button type="button" disabled={busy} onClick={() => {
          setError(undefined);
          setCamera(true);
        }}
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
        onChange={(event) => estimateFile(event.target)} />
      <input ref={galleryInput} type="file" accept="image/*" hidden
        onChange={(event) => estimateFile(event.target)} />
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
