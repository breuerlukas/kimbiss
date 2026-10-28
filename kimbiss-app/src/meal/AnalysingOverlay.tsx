import { useEffect, useState, type CSSProperties } from "react";
import { useTranslation } from "react-i18next";
import { findOutlines } from "./contours.ts";
import { findEstimateStep, type EstimateStep } from "./meals.ts";

const STEPS = ["looking", "searching", "estimating"];
const POLL_MS = 1500;

/**
 * The photo just taken, held still where the live picture was while the api
 * looks at it: darkened, a soft violet line sweeping over it like a scanner,
 * the food's own outlines lighting up wherever the line passes. What it is
 * doing is said by {@link AnalysingLabel} in the camera's foot. Mirrors
 * Insulink's meal camera (index.css has the motion). The outlines are drawn
 * three times, a wide glow and two sharper copies screened over it, so a
 * line's core brightens without burning white.
 */
export function AnalysingOverlay({ photoUrl }: { photoUrl: string }) {
  const [outlines, setOutlines] = useState<{ url: string; ratio: number }>();
  return (
    <div className="absolute inset-0 bg-black">
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
    </div>
  );
}

/**
 * One quiet line in the zoom's slot while a photo is analysed, on the zoom's
 * dark pill in full white (a bright plate can reach behind the foot): a small
 * spinner and the step the api is at. "Analysing" until the first step
 * arrives; after that the step says it better, so the two never stack. One
 * line, a long search query is cut, so the foot never grows.
 */
export function AnalysingLabel() {
  const { t } = useTranslation();
  const step = useEstimateStep();
  return (
    <span role="status" aria-live="polite"
      className="flex max-w-full items-center gap-2.5 rounded-full bg-black/55 px-3 py-1.5 text-sm font-semibold">
      <span aria-hidden className="size-3.5 shrink-0 animate-spin rounded-full border-2 border-white border-t-transparent" />
      <span key={`${step?.step}${step?.detail}`} className="step-in truncate">
        {step ? t(`photo.step.${step.step}`, { detail: step.detail }) : t("photo.analysing")}
      </span>
    </span>
  );
}

/**
 * The api's step, asked every 1.5 s while the label is up. A tick is skipped
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
