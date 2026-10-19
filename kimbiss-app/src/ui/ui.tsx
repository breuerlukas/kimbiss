import i18n from "i18next";
import { useEffect, useRef, useState, type ButtonHTMLAttributes, type ChangeEvent, type InputHTMLAttributes, type ReactNode } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "quiet" | "danger";
};

const BUTTON_STYLES = {
  primary: "bg-accent text-accent-ink font-semibold active:brightness-95",
  quiet: "bg-surface text-ink border border-line active:bg-line",
  danger: "text-danger font-medium",
};

export function Button({ variant = "primary", className = "", ...props }: ButtonProps) {
  return (
    <button
      className={`h-12 rounded-2xl px-5 transition disabled:opacity-50 ${BUTTON_STYLES[variant]} ${className}`}
      {...props}
    />
  );
}

type FieldProps = InputHTMLAttributes<HTMLInputElement> & { label: string; unit?: string };

export function Field({ label, unit, className = "", ...props }: FieldProps) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1 block text-sm text-ink-soft">{label}</span>
      <span className="flex h-12 items-center rounded-xl border border-line bg-surface px-3 focus-within:border-ink">
        <input className="w-full min-w-0 bg-transparent outline-none" {...props} />
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

/** A stack of big tappable options, one of which is picked. */
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
          className={`group rounded-2xl border px-4 py-3 text-left ${
            option.value === value ? "border-accent bg-accent text-accent-ink" : "border-line bg-surface"
          }`}
        >
          <span className="block font-semibold">{option.label}</span>
          {option.hint && <span className="block text-sm opacity-70">{option.hint}</span>}
        </button>
      ))}
    </div>
  );
}

type SheetProps = { open: boolean; onClose: () => void; children: ReactNode };

/** A bottom sheet on the native dialog element, so focus and Escape just work. */
export function Sheet({ open, onClose, children }: SheetProps) {
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (open && !dialog.current?.open) {
      dialog.current?.showModal();
    }
    if (!open && dialog.current?.open) {
      dialog.current.close();
    }
  }, [open]);

  return (
    <dialog
      ref={dialog}
      onClose={onClose}
      onClick={(event) => event.target === dialog.current && onClose()}
      className="mx-auto mt-auto mb-0 max-h-[92dvh] w-full max-w-lg rounded-t-3xl border-t border-line bg-paper p-0 text-ink"
    >
      <div className="px-5 pt-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">{children}</div>
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
