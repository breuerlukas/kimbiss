import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { Camera } from "lucide-react";
import { errorCode } from "../api/client.ts";
import { MealCamera } from "./MealCamera.tsx";
import { cancelEstimate, estimateMeal, type Estimate } from "./meals.ts";
import { photoToJpegBase64 } from "./photo.ts";

type PhotoButtonProps = { onEstimate: (estimate: Estimate, photoUrl: string, photo: string) => void };

/**
 * The round camera button beside the dock, like Insulink's bolus button. It
 * opens Kimbiss' own camera ({@link MealCamera}), which also offers the gallery
 * and, where it cannot open, the system camera (`capture`; without it Android
 * opens the gallery). Either photo is shrunk and the api asked what is on the
 * plate, the camera staying open meanwhile. A failed try shows its error in the
 * camera. "New photo" or closing the camera calls the estimate off: the
 * request is dropped and the api told to stop the model, so no tokens go to an
 * answer nobody reads.
 */
export function PhotoButton({ onEstimate }: PhotoButtonProps) {
  const { t, i18n } = useTranslation();
  const cameraInput = useRef<HTMLInputElement>(null);
  const galleryInput = useRef<HTMLInputElement>(null);
  const [photoUrl, setPhotoUrl] = useState<string>();
  const busy = photoUrl !== undefined;
  const [error, setError] = useState<string>();
  const [camera, setCamera] = useState(false);
  /** The estimate of {@link photoUrl} while it runs. */
  const run = useRef<{ id: string; abort: AbortController }>(undefined);

  function closeCamera() {
    retake();
    setCamera(false);
    setError(undefined);
  }

  /** Calls the running estimate off and hands the live picture back. */
  function retake() {
    const current = run.current;
    if (!current) {
      return;
    }
    run.current = undefined;
    current.abort.abort();
    cancelEstimate(current.id).catch(() => undefined);
    setPhotoUrl(undefined);
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
    const current = { id: crypto.randomUUID(), abort: new AbortController() };
    run.current = current;
    setPhotoUrl(url);
    setError(undefined);
    try {
      const photo = await photoToJpegBase64(file);
      const result = await estimateMeal(photo, i18n.language, current.id, current.abort.signal);
      if (current.abort.signal.aborted) {
        return;
      }
      if (result.items.length === 0) {
        setError("no_food");
        return;
      }
      onEstimate(result, url, photo);
      keepPhoto = true;
      setCamera(false);
    } catch (failure) {
      if (!current.abort.signal.aborted) {
        setError(errorCode(failure));
      }
    } finally {
      if (!keepPhoto) {
        URL.revokeObjectURL(url);
      }
      if (run.current === current) {
        run.current = undefined;
        setPhotoUrl(undefined);
      }
    }
  }

  return (
    <>
      {camera && createPortal(
        <MealCamera error={error} photoUrl={photoUrl} onShot={estimate} onRetake={retake} onClose={closeCamera}
          onGallery={() => galleryInput.current?.click()}
          onCameraApp={() => cameraInput.current?.click()} />,
        document.body,
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
