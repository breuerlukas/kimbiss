import { useEffect, useRef, useState, type PointerEvent, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Camera, Image, RotateCcw, X, Zap } from "lucide-react";
import { formatNumber } from "../locales/format.ts";
import { AnalysingLabel, AnalysingOverlay } from "./AnalysingOverlay.tsx";

/** Slightly wider than the main lens, so a plate fits without leaning over it. */
const START_ZOOM = 0.8;
/** A digital zoom past this only blurs the plate. */
const MAX_ZOOM = 8;
/** Swipe distance in px that doubles (or halves) the zoom. */
const DOUBLING_DISTANCE = 200;

/** Zoom and torch are newer than TypeScript's DOM types; not every browser has them. */
type Capabilities = { zoom?: { min: number; max: number }; torch?: boolean };
type Range = { min: number; max: number };

type MealCameraProps = {
  error?: string;
  /** The photo being analysed, if one is. */
  photoUrl?: string;
  onShot: (photo: Blob) => void;
  onRetake: () => void;
  onGallery: () => void;
  onCameraApp: () => void;
  onClose: () => void;
};

/**
 * Kimbiss' own meal camera in Insulink's look instead of the system camera:
 * the live picture whole at the top on black, close at the top left, and at the
 * foot over a black fade the gallery, a round shutter and the light. A swipe up
 * or down zooms in or out from 0.8× where the lens allows. The shutter hands
 * the frame up. While it is analysed the photo covers the live picture, which
 * keeps running beneath, {@link AnalysingLabel} takes the zoom's slot and the
 * shutter turns into "New photo", which calls the estimate off and hands the
 * live picture back; the side buttons go but keep their room, so nothing
 * jumps. A failed estimate shows its error here, the next try one tap away.
 * Without camera access (refused, no camera) it offers the system camera.
 * ponytail: no tap to focus, the browsers barely support a focus point.
 */
export function MealCamera({ error, photoUrl, onShot, onRetake, onGallery, onCameraApp, onClose }: MealCameraProps) {
  const { t } = useTranslation();
  const video = useRef<HTMLVideoElement>(null);
  const swipe = useRef<number>(undefined);
  const [track, setTrack] = useState<MediaStreamTrack>();
  const [failed, setFailed] = useState(false);
  const [zoom, setZoom] = useState<{ level: number; range: Range }>();
  const [torch, setTorch] = useState(false);
  const torchable = track !== undefined && (track.getCapabilities() as Capabilities).torch === true;
  const analysing = photoUrl !== undefined;

  useEffect(() => {
    let stream: MediaStream | undefined;
    let closed = false;
    const opening = navigator.mediaDevices?.getUserMedia({
      audio: false,
      video: { facingMode: "environment", width: { ideal: 1920 }, height: { ideal: 1440 } },
    }) ?? Promise.reject(new Error("no camera api"));
    opening.then((opened) => {
      if (closed) {
        opened.getTracks().forEach((each) => each.stop());
        return;
      }
      stream = opened;
      video.current!.srcObject = opened;
      const [videoTrack] = opened.getVideoTracks();
      setTrack(videoTrack);
      const range = (videoTrack.getCapabilities() as Capabilities).zoom;
      if (range) {
        const level = clamp(START_ZOOM, range.min, Math.min(range.max, MAX_ZOOM));
        applyZoom(videoTrack, level);
        setZoom({ level, range });
      }
    }, () => !closed && setFailed(true));
    return () => {
      closed = true;
      stream?.getTracks().forEach((each) => each.stop());
    };
  }, []);

  /** Freezes the current frame at full resolution and switches the light off. */
  function shoot() {
    const source = video.current;
    if (!source?.videoWidth) {
      return;
    }
    const canvas = document.createElement("canvas");
    canvas.width = source.videoWidth;
    canvas.height = source.videoHeight;
    canvas.getContext("2d")!.drawImage(source, 0, 0);
    canvas.toBlob((photo) => photo && onShot(photo), "image/jpeg", 0.92);
    if (torch) {
      toggleTorch();
    }
  }

  function toggleTorch() {
    const next = !torch;
    setTorch(next);
    track?.applyConstraints({ advanced: [{ torch: next } as MediaTrackConstraintSet] }).catch(() => setTorch(!next));
  }

  /** Up zooms in, down out, by a factor, so a swipe feels the same at 1× and 4×. */
  function swipeZoom(event: PointerEvent) {
    if (swipe.current === undefined || !zoom || !track) {
      return;
    }
    const level = clamp(zoom.level * 2 ** ((swipe.current - event.clientY) / DOUBLING_DISTANCE),
      zoom.range.min, Math.min(zoom.range.max, MAX_ZOOM));
    swipe.current = event.clientY;
    applyZoom(track, level);
    setZoom({ ...zoom, level });
  }

  return (
    <div className="fixed inset-0 z-40 bg-black text-white">
      <div className="relative mt-[env(safe-area-inset-top)] max-h-[75dvh] touch-none overflow-hidden"
        onPointerDown={(event) => (swipe.current = event.clientY)} onPointerMove={swipeZoom}
        onPointerUp={() => (swipe.current = undefined)} onPointerCancel={() => (swipe.current = undefined)}>
        <video ref={video} autoPlay playsInline muted className="block w-full" />
      </div>
      {photoUrl && <AnalysingOverlay photoUrl={photoUrl} />}
      <button type="button" onClick={onClose} aria-label={t("common.close")}
        className="absolute top-[calc(env(safe-area-inset-top)+0.75rem)] left-3 flex size-11 items-center justify-center rounded-full bg-black/45 backdrop-blur-md">
        <X size={22} aria-hidden />
      </button>
      {failed && !analysing && (
        <div className="absolute inset-x-0 top-1/3 flex flex-col items-center gap-4 px-8 text-center">
          <p>{t("photo.no_camera")}</p>
          <button type="button" onClick={onCameraApp}
            className="flex h-12 items-center gap-2 rounded-full bg-white px-5 font-semibold text-black">
            <Camera size={20} aria-hidden />{t("photo.camera_app")}
          </button>
        </div>
      )}
      <div className="absolute inset-x-0 bottom-0 flex flex-col items-center gap-5 bg-linear-to-b from-transparent via-black/55 via-45% to-black/85 px-6 pt-12 pb-[calc(1.75rem+env(safe-area-inset-bottom))]">
        {error && !analysing && <p role="alert" className="rounded-2xl bg-black/60 px-4 py-2 text-center">{t(`errors.${error}`, t("errors.unknown"))}</p>}
        {analysing ? <AnalysingLabel /> : zoom && (
          <span className="rounded-full bg-black/55 px-3 py-1.5 text-sm font-semibold">
            {formatNumber(zoom.level, Math.round(zoom.level * 10) % 10 === 0 ? 0 : 1)}×
          </span>
        )}
        <div className="grid w-full grid-cols-[1fr_auto_1fr] items-start">
          <DeckButton label={t("photo.gallery_short")} hidden={analysing} onClick={onGallery}><Image size={24} aria-hidden /></DeckButton>
          {analysing ? (
            <button key="retake" type="button" onClick={onRetake} aria-label={t("photo.retake")}
              className="swap-in flex size-[76px] items-center justify-center rounded-full border-4 border-white bg-black/25 active:scale-95">
              <RotateCcw size={30} strokeWidth={2.5} aria-hidden />
            </button>
          ) : (
            <button key="shutter" type="button" onClick={shoot} disabled={!track} aria-label={t("photo.shutter")}
              className="swap-in size-[76px] rounded-full border-4 border-white p-[5px] transition-opacity active:scale-95 disabled:opacity-35">
              <span className="block size-full rounded-full bg-white" />
            </button>
          )}
          {torchable ? (
            <DeckButton label={t("photo.light")} lit={torch} hidden={analysing} onClick={toggleTorch}>
              <Zap size={24} aria-hidden fill={torch ? "currentColor" : "none"} />
            </DeckButton>
          ) : <span />}
        </div>
      </div>
    </div>
  );
}

type DeckButtonProps = { label: string; onClick: () => void; lit?: boolean; hidden?: boolean; children: ReactNode };

/**
 * Dark frosted glass with a light rim, its name small underneath; lit, it turns
 * white. Hidden, it keeps its room, so the shutter between stays put.
 */
function DeckButton({ label, onClick, lit = false, hidden = false, children }: DeckButtonProps) {
  return (
    <button type="button" onClick={onClick} aria-pressed={lit || undefined}
      className={`flex flex-col items-center gap-2 justify-self-center text-xs font-semibold ${hidden ? "invisible" : ""}`}>
      <span className={`flex size-14 items-center justify-center rounded-full border border-white/40 backdrop-blur-md transition-colors ${lit ? "bg-white text-black" : "bg-black/55"}`}>
        {children}
      </span>
      {label}
    </button>
  );
}

/** Not awaited: swipes arrive faster than the camera answers, the next supersedes it. */
function applyZoom(track: MediaStreamTrack, level: number) {
  track.applyConstraints({ advanced: [{ zoom: level } as MediaTrackConstraintSet] }).catch(() => undefined);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
