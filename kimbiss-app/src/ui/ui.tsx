import i18n from "i18next";
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

/** A 44 px round icon button on a panel with a fine rim: day arrows, close. */
export function RoundButton({ label, className = "", ...props }: RoundButtonProps) {
  return (
    <button type="button" aria-label={label}
      className={`flex size-11 shrink-0 items-center justify-center rounded-full border border-rim bg-surface transition active:scale-95 disabled:opacity-35 ${className}`}
      {...props} />
  );
}

/** A section's title, 18/700, with optional icon buttons on the right. */
export function SectionHeader({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="mb-3 flex min-h-11 items-center justify-between gap-3">
      <h2 className="text-lg font-bold">{title}</h2>
      {children}
    </div>
  );
}

type FieldProps = InputHTMLAttributes<HTMLInputElement> & { label: string; unit?: string };

export function Field({ label, unit, className = "", ...props }: FieldProps) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-sm font-semibold text-ink-soft">{label}</span>
      <span className="flex h-[54px] items-center rounded-2xl border border-rim bg-surface px-4 outline-accent focus-within:outline-[1.5px]">
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

/** Insulink's segment switch: a track with the picked option filled in the accent. */
export function Segmented<T extends string>({ options, value, onChange }: ChoiceProps<T>) {
  return (
    <div role="radiogroup" className="flex h-12 rounded-full border border-rim bg-surface p-1">
      {options.map((option) => (
        <button key={option.value} type="button" role="radio" aria-checked={option.value === value}
          onClick={() => onChange(option.value)}
          className={`flex-1 rounded-full font-bold transition-colors ${option.value === value ? "bg-accent text-accent-ink" : "text-ink-soft"}`}>
          {option.label}
        </button>
      ))}
    </div>
  );
}

type SheetProps = { open: boolean; onClose: () => void; children: ReactNode };

/** A bottom sheet on the native dialog element, so focus and Escape just work; a grab handle on top as in Insulink. */
export function Sheet({ open, onClose, children }: SheetProps) {
  const dialog = useRef<HTMLDialogElement>(null);

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
      onClick={(event) => event.target === dialog.current && onClose()}
      className="mx-auto mt-auto mb-0 max-h-[92dvh] outline-none w-full max-w-lg rounded-t-[28px] border-t border-rim bg-paper p-0 text-ink"
    >
      <div aria-hidden className="mx-auto mt-2.5 h-[5px] w-10 rounded-full bg-line" />
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
