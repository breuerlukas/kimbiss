import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import de from "./de.json";
import en from "./en.json";

const LANGUAGE_KEY = "kimbiss.language";

/** The saved choice, else German for a German phone, else English. */
function initialLanguage(): string {
  const saved = localStorage.getItem(LANGUAGE_KEY);
  if (saved) {
    return saved;
  }
  return navigator.language.toLowerCase().startsWith("de") ? "de" : "en";
}

i18n.use(initReactI18next).init({
  lng: initialLanguage(),
  fallbackLng: "en",
  interpolation: { escapeValue: false },
  resources: { de: { translation: de }, en: { translation: en } },
});
document.documentElement.lang = i18n.language;

export function changeLanguage(language: string) {
  localStorage.setItem(LANGUAGE_KEY, language);
  document.documentElement.lang = language;
  return i18n.changeLanguage(language);
}
