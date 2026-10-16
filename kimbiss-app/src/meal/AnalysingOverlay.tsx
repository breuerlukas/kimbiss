import { useTranslation } from "react-i18next";

/**
 * The photo just taken, full screen on black while the api looks at it:
 * darkened, a soft violet band sweeping over it like a scanner, and
 * "Analysing" with a small spinner at the foot. Mirrors Insulink's meal camera.
 */
export function AnalysingOverlay({ photoUrl }: { photoUrl: string }) {
  const { t } = useTranslation();
  return (
    <div className="fixed inset-0 z-50 bg-black" role="status" aria-live="polite">
      <div className="relative overflow-hidden pt-[env(safe-area-inset-top)]">
        <img src={photoUrl} alt="" className="block max-h-[75dvh] w-full object-contain" />
        <div className="absolute inset-0 bg-black/40" />
        <div className="scan-band absolute inset-x-0 h-[90px]" />
      </div>
      <p className="absolute inset-x-0 bottom-[calc(3.5rem+env(safe-area-inset-bottom))] flex items-center justify-center gap-3 text-lg font-semibold text-white">
        <span aria-hidden className="size-[18px] animate-spin rounded-full border-[2.5px] border-white border-t-transparent" />
        {t("photo.analysing")}
      </p>
    </div>
  );
}
