import i18n from "i18next";
import { useTranslation } from "react-i18next";
import { Check } from "lucide-react";
import { useEffect, useRef, useState, type ButtonHTMLAttributes, type ChangeEvent, type InputHTMLAttributes, type ReactNode } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "quiet" | "danger";
};

/** Insulink's buttons: pills, never outlined. Quiet is the accent's soft tint, danger the red one. */
const BUTTON_STYLES = {
  primary: "bg-accent text-accent-ink",
  quiet: "bg-accent-soft text-accent-text",
  danger: "bg-danger-soft text-danger",
};

export function Button({ variant = "primary", className = "", ...props }: ButtonProps) {
  return (
    <button
      className={`h-[54px] rounded-full px-6 font-bold transition active:scale-[0.98] disabled:opacity-40 disabled:active:scale-100 ${BUTTON_STYLES[variant]} ${className}`}
      {...props}
    />
  );
}

type RoundButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { label: string };

/** A 44 px round icon button on a card with a strong rim: day arrows, calendar, close. Disabled it fades into the page. */
export function RoundButton({ label, className = "", ...props }: RoundButtonProps) {
  return (
    <button type="button" aria-label={label}
      className={`flex size-11 shrink-0 items-center justify-center rounded-full border border-rim-strong bg-surface text-ink transition active:scale-95 disabled:border-rim disabled:bg-transparent disabled:text-ink-faint disabled:active:scale-100 ${className}`}
      {...props} />
  );
}

/** A section's title, display font 20/700, a mono meta beside it, optional buttons on the right. */
export function SectionHeader({ title, meta, children }: { title: string; meta?: string; children?: ReactNode }) {
  return (
    <div className="mb-3 flex min-h-11 items-center justify-between gap-3">
      <div className="flex min-w-0 items-baseline gap-2.5">
        <h2 className="font-display text-xl font-bold tracking-[-0.01em]">{title}</h2>
        {meta && <span className="truncate font-mono text-[11px] text-ink-soft uppercase">{meta}</span>}
      </div>
      {children}
    </div>
  );
}

/** Coloured text on a tint of the same colour, as a pill. `tone` is a text and background class pair. */
export function Chip({ tone, children }: { tone: string; children: ReactNode }) {
  return <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap ${tone}`}>{children}</span>;
}

export const MACROS = [
  { key: "protein", dot: "bg-protein", bar: "bg-protein", track: "bg-protein/15", text: "text-protein", kcalPerGram: 4 },
  { key: "carbs", dot: "bg-carbs", bar: "bg-carbs", track: "bg-carbs/15", text: "text-carbs", kcalPerGram: 4 },
  { key: "fat", dot: "bg-fat", bar: "bg-fat", track: "bg-fat/15", text: "text-fat", kcalPerGram: 9 },
] as const;
export type Macro = (typeof MACROS)[number];

/** A macro's dot and name, then its value; `share` adds a 4 px bar on a track of its own colour. */
export function MacroCard({ macro, value, unit, share, footer }: {
  macro: Macro; value: string; unit: string; share?: number; footer?: string;
}) {
  const { t } = useTranslation();
  return (
    <div className="flex min-w-0 flex-col gap-2 rounded-[18px] border border-rim bg-surface p-3 max-[379px]:px-2.5">
      <div className="flex min-w-0 items-center gap-1.5">
        <span aria-hidden className={`size-2 shrink-0 rounded-full ${macro.dot}`} />
        {/* Under 390 px "Kohlenhydr." no longer fits beside its dot: KH there. */}
        <span className="truncate text-xs font-medium text-ink-soft max-[379px]:hidden">{t(macro.key === "carbs" ? "macros.carbs_card" : `macros.${macro.key}`)}</span>
        <span className="hidden truncate text-xs font-medium text-ink-soft max-[379px]:inline">{t(macro.key === "carbs" ? "macros.carbs_short" : `macros.${macro.key}`)}</span>
      </div>
      <div className="font-display text-[22px] leading-tight font-bold tracking-[-0.02em] whitespace-nowrap max-[379px]:text-[19px]">
        {value}<span className="text-xs font-medium tracking-normal text-ink-soft max-[379px]:text-[11px]"> {unit}</span>
      </div>
      {share !== undefined && (
        <div className={`h-1 rounded-full ${macro.track}`}>
          <div className={`h-1 rounded-full ${macro.bar} transition-[width] duration-500`} style={{ width: `${Math.min(100, share * 100)}%` }} />
        </div>
      )}
      {footer && <span className="truncate font-mono text-[11px] text-ink-soft uppercase">{footer}</span>}
    </div>
  );
}

type FieldProps = InputHTMLAttributes<HTMLInputElement> & { label: string; unit?: string };

export function Field({ label, unit, className = "", ...props }: FieldProps) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-2 block text-[13px] font-medium text-ink-soft">{label}</span>
      <span className="flex h-[52px] items-center rounded-[18px] border border-white/10 bg-surface px-4 outline-accent focus-within:outline-[1.5px]">
        <input className="w-full min-w-0 bg-transparent font-semibold outline-none placeholder:font-normal placeholder:text-ink-soft/60" {...props} />
        {unit && <span className="ml-2 text-ink-soft">{unit}</span>}
      </span>
    </label>
  );
}

type ChoiceProps<T extends string | number> = {
  options: { value: T; label: string; hint?: string }[];
  value: T | undefined;
  onChange: (value: T) => void;
};

/** A stack of big tappable options, one of which is picked: ringed in the accent, with a check. */
export function Choice<T extends string | number>({ options, value, onChange }: ChoiceProps<T>) {
  return (
    <div role="radiogroup" className="grid gap-2">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={option.value === value}
          onClick={() => onChange(option.value)}
          className={`flex min-h-[60px] items-center gap-3 rounded-[20px] border px-4 py-3 text-left transition-colors ${
            option.value === value ? "border-accent bg-accent-soft" : "border-rim bg-surface"
          }`}
        >
          <span className="min-w-0 flex-1">
            <span className="block font-bold">{option.label}</span>
            {option.hint && <span className="block text-sm text-ink-soft">{option.hint}</span>}
          </span>
          <span aria-hidden className={`flex size-6 shrink-0 items-center justify-center rounded-full border-2 ${
            option.value === value ? "border-accent bg-accent text-accent-ink" : "border-line"}`}>
            {option.value === value && <Check size={14} strokeWidth={3.5} />}
          </span>
        </button>
      ))}
    </div>
  );
}

/** A segment switch: a card with the picked option filled in the accent. */
export function Segmented<T extends string>({ options, value, onChange, label }: ChoiceProps<T> & { label?: string }) {
  return (
    <div role="radiogroup" aria-label={label} className="flex gap-1 rounded-[18px] border border-rim bg-surface p-1">
      {options.map((option) => (
        <button key={option.value} type="button" role="radio" aria-checked={option.value === value}
          onClick={() => onChange(option.value)}
          className={`h-11 flex-1 rounded-[14px] text-sm font-semibold transition-colors ${option.value === value ? "bg-accent text-accent-ink" : "text-ink-soft"}`}>
          {option.label}
        </button>
      ))}
    </div>
  );
}

type SheetProps = { open: boolean; onClose: () => void; children: ReactNode; className?: string; label?: string };

/**
 * A bottom sheet on the native dialog element, so focus and Escape just work;
 * a grab handle on top. Pulled down by more than 100 px from its top (scrolled
 * to the start) it closes.
 */
export function Sheet({ open, onClose, children, className = "max-h-[92dvh]", label }: SheetProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  const drag = useRef<{ startY: number; dy: number }>(undefined);

  useEffect(() => {
    if (open && !dialog.current?.open) {
      dialog.current?.showModal();
      // The sheet itself, not its first input: on a phone that would open the keyboard.
      dialog.current?.focus();
    }
    if (!open && dialog.current?.open) {
      dialog.current.close();
    }
  }, [open]);

  return (
    <dialog
      ref={dialog}
      tabIndex={-1}
      onClose={onClose}
      aria-label={label}
      onClick={(event) => event.target === dialog.current && onClose()}
      onTouchStart={(event) => {
        drag.current = dialog.current!.scrollTop <= 0 ? { startY: event.touches[0].clientY, dy: 0 } : undefined;
      }}
      onTouchMove={(event) => {
        if (drag.current) {
          drag.current.dy = Math.max(0, event.touches[0].clientY - drag.current.startY);
          dialog.current!.style.transform = `translateY(${drag.current.dy}px)`;
        }
      }}
      onTouchEnd={() => {
        dialog.current!.style.transform = "";
        if ((drag.current?.dy ?? 0) > 100) {
          onClose();
        }
        drag.current = undefined;
      }}
      className={`mx-auto mt-auto mb-0 w-full max-w-lg rounded-t-[32px] border-t border-rim-strong bg-sheet p-0 text-ink outline-none ${className}`}
    >
      <div aria-hidden className="mx-auto mt-2.5 h-1 w-10 rounded-full bg-white/18" />
      <div className="px-4 pt-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]">{children}</div>
    </dialog>
  );
}

type NumberProps = { value: number | undefined; onValue: (value: number | undefined) => void };
type InputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange">;

/** A Field for a number, typed with a decimal comma or point. */
export function NumberField({ value, onValue, ...props }: Omit<FieldProps, "value" | "onChange"> & NumberProps) {
  return <Field inputMode="decimal" {...props} {...useNumberText({ value, onValue })} />;
}

/** A bare input for a number, typed with a decimal comma or point. */
export function NumberInput({ value, onValue, ...props }: InputProps & NumberProps) {
  return <input inputMode="decimal" {...props} {...useNumberText({ value, onValue })} />;
}

/**
 * Keeps what was typed ("72," or "72,0") as long as it still means the value,
 * so a comma is not wiped out the moment it is typed. A value set from outside
 * (a reset, a new estimate) replaces the text.
 */
function useNumberText({ value, onValue }: NumberProps) {
  const [text, setText] = useState(() => numberText(value));
  if (text !== numberText(value) && parseNumber(text) !== value) {
    setText(numberText(value));
  }
  return {
    value: text,
    onChange: (event: ChangeEvent<HTMLInputElement>) => {
      setText(event.target.value);
      onValue(parseNumber(event.target.value));
    },
  };
}

/** Empty instead of 0 or NaN, with the language's decimal mark (72,5 in German). */
function numberText(value: number | undefined): string {
  return value === undefined || Number.isNaN(value) ? ""
    : value.toLocaleString(i18n.language, { useGrouping: false, maximumFractionDigits: 3 });
}

function parseNumber(text: string): number | undefined {
  const parsed = parseFloat(text.replace(",", "."));
  return Number.isNaN(parsed) ? undefined : parsed;
}
