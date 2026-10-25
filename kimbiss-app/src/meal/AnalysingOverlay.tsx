import { useEffect, useState, type CSSProperties } from "react";
import { useTranslation } from "react-i18next";
import { findOutlines } from "./contours.ts";
import { findEstimateStep, type EstimateStep } from "./meals.ts";

const STEPS = ["looking", "searching", "estimating"];
const POLL_MS = 1500;

/**
 * The photo just taken, full screen on black while the api looks at it:
 * darkened, a soft violet line sweeping over it like a scanner, the food's own
 * outlines lighting up wherever the line passes, and "Analysing" with a small
 * spinner at the foot, the step the api is at below it. Mirrors Insulink's meal camera (index.css has the
 * motion). The outlines are drawn three times, a wide glow and two sharper
 * copies screened over it, so a line's core brightens without burning white.
 */
export function AnalysingOverlay({ photoUrl }: { photoUrl: string }) {
  const { t } = useTranslation();
  const [outlines, setOutlines] = useState<{ url: string; ratio: number }>();
  const step = useEstimateStep();
  return (
    <div className="fixed inset-0 z-50 bg-black" role="status" aria-live="polite">
      <div className="relative mt-[env(safe-area-inset-top)] max-h-[75dvh] overflow-hidden">
        <img src={photoUrl} alt="" className="block w-full"
          onLoad={(event) => setOutlines(findOutlines(event.currentTarget))} />
        <div className="absolute inset-0 bg-black/40" />
        <div className="scan absolute inset-0">
          <div className="scan-band absolute inset-x-0 h-[90px]" />
          {outlines && (
            <div className="scan-glow absolute inset-0">
              <div className="absolute inset-x-0 top-0"
                style={{ aspectRatio: outlines.ratio, "--outlines": `url(${outlines.url})` } as CSSProperties}>
                <div className="absolute inset-0 opacity-90 blur-[6px]"><div className="food-outlines" /></div>
                <div className="absolute inset-0 mix-blend-screen blur-[1.5px]"><div className="food-outlines" /></div>
                <div className="absolute inset-0 mix-blend-screen"><div className="food-outlines" /></div>
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="absolute inset-x-0 bottom-[calc(1.5rem+env(safe-area-inset-bottom))] px-8 text-center">
        <p className="flex items-center justify-center gap-3 text-lg font-semibold text-white">
          <span aria-hidden className="size-[18px] animate-spin rounded-full border-[2.5px] border-white border-t-transparent" />
          {t("photo.analysing")}
        </p>
        <p key={`${step?.step}${step?.detail}`} className="step-in mt-2 line-clamp-2 h-12 text-white/70">
          {step && t(`photo.step.${step.step}`, { detail: step.detail })}
        </p>
      </div>
    </div>
  );
}

/**
 * The api's step, asked every 1.5 s while the overlay is up. A tick is skipped
 * while the previous answer is on its way, so a slow network never stacks
 * requests; a failed ask or an unknown step keeps the last one.
 */
function useEstimateStep() {
  const [step, setStep] = useState<EstimateStep>();
  useEffect(() => {
    let asking = false;
    const timer = setInterval(() => {
      if (asking) {
        return;
      }
      asking = true;
      findEstimateStep()
        .then((found) => found.step && STEPS.includes(found.step) && setStep(found), () => undefined)
        .finally(() => (asking = false));
    }, POLL_MS);
    return () => clearInterval(timer);
  }, []);
  return step;
}
