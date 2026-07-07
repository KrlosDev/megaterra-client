/**
 * Curated ISO 4217 currency list — Panamerican markets first, then major
 * world currencies. Currency is auto-filled from the selected country in the
 * project form; any code not in this list is still selectable (injected as an
 * extra option), so this only needs to cover the common manual choices.
 */
export type CurrencyOption = { code: string; name: string }

export const CURRENCIES: CurrencyOption[] = [
  { code: "USD", name: "US Dollar" },
  { code: "PAB", name: "Panamanian Balboa" },
  { code: "COP", name: "Colombian Peso" },
  { code: "MXN", name: "Mexican Peso" },
  { code: "CRC", name: "Costa Rican Colón" },
  { code: "BRL", name: "Brazilian Real" },
  { code: "ARS", name: "Argentine Peso" },
  { code: "CLP", name: "Chilean Peso" },
  { code: "PEN", name: "Peruvian Sol" },
  { code: "UYU", name: "Uruguayan Peso" },
  { code: "BOB", name: "Bolivian Boliviano" },
  { code: "PYG", name: "Paraguayan Guaraní" },
  { code: "VES", name: "Venezuelan Bolívar" },
  { code: "GTQ", name: "Guatemalan Quetzal" },
  { code: "HNL", name: "Honduran Lempira" },
  { code: "NIO", name: "Nicaraguan Córdoba" },
  { code: "DOP", name: "Dominican Peso" },
  { code: "JMD", name: "Jamaican Dollar" },
  { code: "TTD", name: "Trinidad & Tobago Dollar" },
  { code: "CAD", name: "Canadian Dollar" },
  { code: "EUR", name: "Euro" },
  { code: "GBP", name: "British Pound" },
  { code: "CHF", name: "Swiss Franc" },
  { code: "JPY", name: "Japanese Yen" },
  { code: "CNY", name: "Chinese Yuan" },
  { code: "AUD", name: "Australian Dollar" },
]

/** Label for a currency code, falling back to the raw code if unknown. */
export function currencyLabel(code: string): string {
  const found = CURRENCIES.find((currency) => currency.code === code)
  return found ? `${found.code} — ${found.name}` : code
}
