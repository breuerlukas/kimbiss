import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { Camera } from "lucide-react";
import { errorCode } from "../api/client.ts";
import { AnalysingOverlay } from "./AnalysingOverlay.tsx";
import { MealCamera } from "./MealCamera.tsx";
import { estimateMeal, type Estimate } from "./meals.ts";
import { photoToJpegBase64 } from "./photo.ts";

type PhotoButtonProps = { onEstimate: (estimate: Estimate, photoUrl: string, photo: string) => void };

/**
 * The round camera button beside the dock, like Insulink's bolus button. It
 * opens Kimbiss' own camera ({@link MealCamera}), which also offers the gallery
 * and, where it cannot open, the system camera (`capture`; without it Android
 * opens the gallery). Either photo is shrunk and the api asked what is on the
 * plate. A failed try shows its error in the camera, if it is open, else in a
 * banner over the dock.
 */
export function PhotoButton({ onEstimate }: PhotoButtonProps) {
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
    <>
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
      {error && !camera && (
        <p role="alert" className="fixed inset-x-3 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] mx-auto max-w-md rounded-2xl bg-danger-soft px-4 py-3 text-center font-semibold text-danger backdrop-blur-md">
          {t(`errors.${error}`, t("errors.unknown"))}
        </p>
      )}
      <button type="button" disabled={busy} aria-label={t("photo.take")}
        onClick={() => {
          setError(undefined);
          setCamera(true);
        }}
        className="flex size-[62px] items-center justify-center rounded-full bg-accent text-accent-ink shadow-[0_8px_24px_rgb(29_21_38/0.18)] transition active:scale-95 disabled:opacity-60">
        <Camera size={26} aria-hidden />
      </button>
      <input ref={cameraInput} type="file" accept="image/*" capture="environment" hidden
        onChange={(event) => estimateFile(event.target)} />
      <input ref={galleryInput} type="file" accept="image/*" hidden
        onChange={(event) => estimateFile(event.target)} />
    </>
  );
}
