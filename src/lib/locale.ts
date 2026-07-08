import { es } from "date-fns/locale"
import type { Locale } from "date-fns"
import i18n from "@/i18n"

/** BCP-47 locale for Intl number/currency formatting, from the active language. */
export function activeLocale(): string {
  return i18n.language?.startsWith("es") ? "es-PA" : "en-US"
}

/** date-fns locale for the active language (undefined = English default). */
export function dateLocale(): Locale | undefined {
  return i18n.language?.startsWith("es") ? es : undefined
}
