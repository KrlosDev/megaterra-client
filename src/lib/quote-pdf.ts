import { jsPDF } from "jspdf"
import type { Quote } from "@/services"
import { formatPrice } from "./inventory-format"

export type QuotePdfData = {
  client: string
  projectName: string
  unitLabel: string
  currency: string | null
  price: number
  downPct: number
  downAmount: number
  financed: number
  years: number
  months: number
  rate: number
  monthly: number
  total: number
}

/**
 * Map a stored quote row onto {@link QuotePdfData} so a recorded quote can be
 * re-downloaded from the Quotes page. Numbers are coerced (Supabase may return
 * numerics as strings). The unit label falls back to the unit name only — unit
 * size was not snapshotted on the quote, so it is omitted from the re-download.
 */
export function quoteToPdfData(quote: Quote): QuotePdfData {
  const num = (value: number | null) => Number(value ?? 0)
  return {
    client: quote.client_name ?? quote.lead?.lead_name ?? "",
    projectName: quote.project?.project_name ?? "",
    unitLabel: quote.unit?.unit ?? "—",
    currency: quote.currency,
    price: num(quote.price),
    downPct: num(quote.down_pct),
    downAmount: num(quote.down_amount),
    financed: num(quote.financed),
    years: num(quote.term_years),
    months: num(quote.term_months),
    rate: num(quote.interest_rate),
    monthly: num(quote.monthly_payment),
    total: num(quote.total),
  }
}

// Brand palette (matches the app's green primary).
const BRAND: [number, number, number] = [45, 106, 79] // #2d6a4f
const BRAND_LIGHT: [number, number, number] = [232, 245, 233]
const TEXT: [number, number, number] = [33, 37, 41]
const MUTED: [number, number, number] = [120, 128, 134]

/** Generate and download a designed one-page financing quote PDF. */
export function downloadQuotePdf(data: QuotePdfData) {
  const doc = new jsPDF({ unit: "mm", format: "a4" })
  const money = (amount: number) => formatPrice(amount, data.currency)
  const pageW = 210
  const marginX = 14
  const rightX = pageW - marginX
  const today = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  // Header band.
  doc.setFillColor(...BRAND)
  doc.rect(0, 0, pageW, 32, "F")
  doc.setTextColor(255, 255, 255)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(22)
  doc.text("MEGATERRA", marginX, 17)
  doc.setFont("helvetica", "normal")
  doc.setFontSize(11)
  doc.text("Financing Quote", marginX, 25)
  doc.setFontSize(9)
  doc.text(today, rightX, 17, { align: "right" })

  let cursorY = 46

  // Quote details.
  const heading = (label: string) => {
    doc.setFont("helvetica", "bold")
    doc.setFontSize(12)
    doc.setTextColor(...BRAND)
    doc.text(label, marginX, cursorY)
    cursorY += 3
    doc.setDrawColor(...BRAND)
    doc.setLineWidth(0.4)
    doc.line(marginX, cursorY, rightX, cursorY)
    cursorY += 7
  }

  const row = (label: string, value: string, bold = false) => {
    doc.setFont("helvetica", "normal")
    doc.setFontSize(10)
    doc.setTextColor(...MUTED)
    doc.text(label, marginX, cursorY)
    doc.setFont("helvetica", bold ? "bold" : "normal")
    doc.setTextColor(...TEXT)
    doc.text(value, rightX, cursorY, { align: "right" })
    cursorY += 8
  }

  heading("Quote details")
  row("Client", data.client || "—")
  row("Project", data.projectName || "—")
  row("Unit", data.unitLabel || "—")
  cursorY += 4

  heading("Financing summary")
  row("Unit price", money(data.price))
  row(`Down payment (${data.downPct}%)`, money(data.downAmount))
  row("Amount to finance", money(data.financed))
  row("Term", `${data.years} years (${data.months} months)`)
  row("Interest rate", `${data.rate}% annual`)
  cursorY += 2

  // Highlighted monthly payment.
  doc.setFillColor(...BRAND_LIGHT)
  doc.roundedRect(marginX, cursorY, rightX - marginX, 26, 3, 3, "F")
  doc.setFont("helvetica", "normal")
  doc.setFontSize(10)
  doc.setTextColor(...BRAND)
  doc.text("Estimated monthly payment", marginX + 6, cursorY + 10)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(22)
  doc.text(money(data.monthly), rightX - 6, cursorY + 16, { align: "right" })
  cursorY += 34

  row("Total to pay", money(data.total), true)

  // Footer.
  doc.setDrawColor(220, 223, 226)
  doc.setLineWidth(0.3)
  doc.line(marginX, 275, rightX, 275)
  doc.setFont("helvetica", "normal")
  doc.setFontSize(8)
  doc.setTextColor(...MUTED)
  doc.text(
    "This is an estimate for informational purposes only and does not constitute a binding offer.",
    marginX,
    281
  )
  doc.text(`Generated on ${today}`, marginX, 286)

  const safeName = (data.client || data.projectName || "megaterra")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
  doc.save(`quote-${safeName || "megaterra"}.pdf`)
}
