import i18n from "i18next"
import { initReactI18next } from "react-i18next"
import LanguageDetector from "i18next-browser-languagedetector"
import { english } from "@/languages/english"
import { spanish } from "@/languages/spanish"

// App-wide i18next instance. English is the source-of-truth and fallback; the
// detector picks the initial language from localStorage (key "lang") or the
// browser, but once a signed-in profile loads, its `preferred_language` wins
// (applied in the auth store) since the DB is the source of truth per user.
i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: english },
      es: { translation: spanish },
    },
    fallbackLng: "en",
    supportedLngs: ["en", "es"],
    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
      lookupLocalStorage: "lang",
    },
    interpolation: { escapeValue: false },
  })

export default i18n
