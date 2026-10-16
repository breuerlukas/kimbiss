import i18n from "i18next";

/** Whole numbers in the current language (1.240 in German, 1,240 in English). */
export function formatNumber(value: number, fractionDigits = 0): string {
  return value.toLocaleString(i18n.language, {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });
}

export function formatTime(epochMillis: number): string {
  return new Date(epochMillis).toLocaleTimeString(i18n.language, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDate(date: Date, options: Intl.DateTimeFormatOptions): string {
  return date.toLocaleDateString(i18n.language, options);
}
