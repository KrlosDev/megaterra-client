import { useCallback, useEffect, useMemo, useState } from "react"
import { createFileRoute } from "@tanstack/react-router"
import { format } from "date-fns"
import { DownloadIcon, PlusIcon, SendIcon } from "lucide-react"
import { useTranslation } from "react-i18next"
import type { TFunction } from "i18next"
import { toast } from "sonner"
import { quotesService, type Quote } from "@/services"
import { formatPrice } from "@/lib/inventory-format"
import { dateLocale } from "@/lib/locale"
import { downloadQuotePdf, quoteToPdfData } from "@/lib/quote-pdf"
import {
  useQuotesStore,
  QUOTES_DEFAULT_COLUMN_VISIBILITY,
  type QuoteStatusFilter,
} from "@/stores/quotes-store"
import { QuoterSheet } from "@/components/quoter/quoter-sheet"
import { HeaderSlot } from "@/components/layout/header-slot"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import { DataTable, type DataTableColumn } from "@/components/data-table"

export const Route = createFileRoute("/_authenticated/quotes/")({
  component: RouteComponent,
})

const FILTER_VALUES: QuoteStatusFilter[] = ["all", "sent", "unsent"]

function fmtDate(value: string | null): string {
  return value
    ? format(new Date(value), "MMM d, yyyy", { locale: dateLocale() })
    : "—"
}

function fmtPct(value: number | null): string {
  return value == null ? "—" : `${Number(value)}%`
}

// Columns for the quotes DataTable. Built as a factory so the row actions can
// close over the page's toggle / re-download / resend callbacks.
function createQuotesColumns(
  t: TFunction,
  onToggleSent: (quote: Quote, next: boolean) => void,
  onRedownload: (quote: Quote) => void,
  onResend: (quote: Quote) => void
): DataTableColumn<Quote>[] {
  return [
    {
      id: "client",
      header: t("quotes.client"),
      accessor: (quote) => quote.client_name ?? quote.lead?.lead_name ?? null,
      cell: (quote) => (
        <span className="font-medium">
          {quote.client_name ?? quote.lead?.lead_name ?? "—"}
        </span>
      ),
    },
    {
      id: "lead",
      header: t("quotes.lead"),
      accessor: (quote) => quote.lead?.lead_name ?? null,
      cell: (quote) => quote.lead?.lead_name ?? "—",
    },
    {
      id: "phone",
      header: t("leads.phone"),
      accessor: (quote) => quote.lead?.lead_phone ?? null,
      cell: (quote) => quote.lead?.lead_phone ?? "—",
      enableFilter: false,
    },
    {
      id: "advisor",
      header: t("leads.advisor"),
      accessor: (quote) =>
        quote.advisor?.display_name || quote.advisor?.email || null,
      cell: (quote) =>
        quote.advisor?.display_name || quote.advisor?.email || "—",
    },
    {
      id: "project",
      header: t("leads.project"),
      accessor: (quote) => quote.project?.project_name ?? null,
      cell: (quote) => quote.project?.project_name ?? "—",
    },
    {
      id: "unit",
      header: t("quotes.unit"),
      accessor: (quote) => quote.unit?.unit ?? null,
      cell: (quote) => quote.unit?.unit ?? "—",
    },
    {
      id: "currency",
      header: t("quotes.currency"),
      accessor: (quote) => quote.currency,
      cell: (quote) => quote.currency ?? "—",
    },
    {
      id: "price",
      header: t("quotes.price"),
      align: "right",
      accessor: (quote) => quote.price,
      cell: (quote) => formatPrice(quote.price, quote.currency),
      enableFilter: false,
    },
    {
      id: "down_pct",
      header: t("quotes.downPct"),
      align: "right",
      size: 120,
      accessor: (quote) => quote.down_pct,
      cell: (quote) => fmtPct(quote.down_pct),
      enableFilter: false,
    },
    {
      id: "down_amount",
      header: t("quotes.downPayment"),
      align: "right",
      accessor: (quote) => quote.down_amount,
      cell: (quote) => formatPrice(quote.down_amount, quote.currency),
      enableFilter: false,
    },
    {
      id: "financed",
      header: t("quotes.financed"),
      accessor: (quote) => quote.financed,
      cell: (quote) => formatPrice(quote.financed, quote.currency),
      enableFilter: false,
    },
    {
      id: "term",
      header: t("quotes.term"),
      accessor: (quote) => quote.term_months,
      cell: (quote) =>
        quote.term_years == null
          ? "—"
          : t("quotes.termValue", {
              years: quote.term_years,
              months: quote.term_months ?? "—",
            }),
      enableFilter: false,
    },
    {
      id: "rate",
      header: t("quotes.rate"),
      align: "right",
      size: 80,
      accessor: (quote) => quote.interest_rate,
      cell: (quote) => fmtPct(quote.interest_rate),
      enableFilter: false,
    },
    {
      id: "monthly",
      header: t("quotes.monthly"),
      accessor: (quote) => quote.monthly_payment,
      cell: (quote) => formatPrice(quote.monthly_payment, quote.currency),
      enableFilter: false,
    },
    {
      id: "total",
      header: t("quotes.total"),
      accessor: (quote) => quote.total,
      cell: (quote) => formatPrice(quote.total, quote.currency),
      enableFilter: false,
    },
    {
      id: "status",
      header: t("common.status"),
      accessor: (quote) => quote.sent,
      enableFilter: true,
      enableResizing: false,
      filterLabel: (value) => (value ? t("quotes.sent") : t("quotes.notSent")),
      cell: (quote) => (
        <div className="flex items-center gap-2">
          <Switch
            checked={quote.sent}
            onCheckedChange={(next) => onToggleSent(quote, next)}
            aria-label={quote.sent ? t("quotes.notSent") : t("quotes.sent")}
          />
          <Badge variant={quote.sent ? "default" : "outline"}>
            {quote.sent ? t("quotes.sent") : t("quotes.notSent")}
          </Badge>
        </div>
      ),
    },
    {
      id: "sent_at",
      header: t("quotes.sentOn"),
      accessor: (quote) => quote.sent_at,
      cell: (quote) => fmtDate(quote.sent_at),
      enableFilter: false,
    },
    {
      id: "created",
      header: t("quotes.createdCol"),
      accessor: (quote) => quote.created_at,
      cell: (quote) => fmtDate(quote.created_at),
      enableFilter: false,
    },
    {
      id: "actions",
      header: t("common.actions"),
      align: "right",
      enableSorting: false,
      enableFilter: false,
      enableHiding: false,
      enableResizing: false,
      cell: (quote) => (
        <div className="flex justify-end gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onRedownload(quote)}
            aria-label={t("common.download")}
          >
            <DownloadIcon />
          </Button>
          <Button
            size="sm"
            onClick={() => onResend(quote)}
            aria-label={t("quotes.resend")}
          >
            <SendIcon />
            {t("quotes.resend")}
          </Button>
        </div>
      ),
    },
  ]
}

function RouteComponent() {
  const { t } = useTranslation()
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [loading, setLoading] = useState(true)
  const [newQuoteOpen, setNewQuoteOpen] = useState(false)

  const store = useQuotesStore()
  const filter = store.statusFilter
  const setFilter = store.setStatusFilter

  function load() {
    return quotesService
      .list()
      .then(setQuotes)
      .catch((error) => {
        toast.error(
          error instanceof Error ? error.message : t("quotes.loadFailed")
        )
      })
  }

  useEffect(() => {
    let active = true
    quotesService
      .list()
      .then((data) => {
        if (active) setQuotes(data)
      })
      .catch((error) => {
        toast.error(
          error instanceof Error ? error.message : t("quotes.loadFailed")
        )
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  // Flip a quote's sent status optimistically (stamping sent_at so the "Sent on"
  // column updates immediately), then reconcile with the server row or revert on
  // failure. Stable identity so the columns memo never rebuilds.
  const handleToggleSent = useCallback(
    (quote: Quote, next: boolean, force = false) => {
      if (!force && quote.sent === next) return
      const optimisticSentAt = next ? new Date().toISOString() : null
      setQuotes((prev) =>
        prev.map((row) =>
          row.id === quote.id
            ? { ...row, sent: next, sent_at: optimisticSentAt }
            : row
        )
      )
      quotesService
        .setSent(quote.id, next)
        .then((updated) => {
          // Adopt the server's authoritative sent / sent_at values.
          setQuotes((prev) =>
            prev.map((row) =>
              row.id === quote.id
                ? { ...row, sent: updated.sent, sent_at: updated.sent_at }
                : row
            )
          )
        })
        .catch((error) => {
          setQuotes((prev) =>
            prev.map((row) =>
              row.id === quote.id
                ? { ...row, sent: quote.sent, sent_at: quote.sent_at }
                : row
            )
          )
          toast.error(
            error instanceof Error ? error.message : t("quotes.updateFailed")
          )
        })
    },
    [t]
  )

  // WhatsApp sending isn't wired up yet: for now "resend" (re-)marks the quote
  // sent and re-stamps "Sent on" to now, even if it was already sent.
  const handleResend = useCallback(
    (quote: Quote) => {
      toast(t("quotes.whatsappComingSoon"))
      handleToggleSent(quote, true, true)
    },
    [handleToggleSent, t]
  )

  const columns = useMemo(
    () =>
      createQuotesColumns(
        t,
        handleToggleSent,
        (quote) => downloadQuotePdf(quoteToPdfData(quote)),
        handleResend
      ),
    [t, handleToggleSent, handleResend]
  )

  const counts = useMemo(() => {
    const tally = { total: quotes.length, sent: 0, unsent: 0 }
    for (const quote of quotes) {
      if (quote.sent) tally.sent++
      else tally.unsent++
    }
    return tally
  }, [quotes])

  const visibleQuotes = useMemo(() => {
    if (filter === "all") return quotes
    return quotes.filter((quote) => quote.sent === (filter === "sent"))
  }, [quotes, filter])

  const stats = [
    { key: "all", label: t("quotes.totalQuotes"), value: counts.total },
    { key: "sent", label: t("quotes.sent"), value: counts.sent },
    { key: "unsent", label: t("quotes.notSent"), value: counts.unsent },
  ]

  return (
    <div className="flex flex-col gap-4">
      <HeaderSlot>
        <Button size="sm" onClick={() => setNewQuoteOpen(true)}>
          <PlusIcon />
          {t("quotes.newQuote")}
        </Button>
      </HeaderSlot>

      {/* Summary stat cards */}
      <div className="grid grid-cols-3 gap-4">
        {stats.map((stat) => (
          <Card key={stat.key} size="sm" className="py-2">
            <CardContent className="flex items-baseline justify-between gap-2">
              <span className="text-[0.7rem] font-medium tracking-wide text-muted-foreground uppercase">
                {stat.label}
              </span>
              <span className="text-xl font-semibold">
                {loading ? <Skeleton className="h-6 w-8" /> : stat.value}
              </span>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Sent-status filter pills */}
      <div className="flex flex-wrap items-center gap-2">
        {FILTER_VALUES.map((value) => (
          <Button
            key={value}
            size="sm"
            variant={filter === value ? "default" : "outline"}
            onClick={() => setFilter(value)}
          >
            {value === "all"
              ? t("common.all")
              : value === "sent"
                ? t("quotes.sent")
                : t("quotes.notSent")}
          </Button>
        ))}
      </div>

      <DataTable
        data={visibleQuotes}
        columns={columns}
        loading={loading}
        filterable
        resizable
        columnsPanel
        minRows={13}
        emptyMessage={t("quotes.empty")}
        sorting={store.sorting}
        onSortingChange={store.setSorting}
        columnFilters={store.columnFilters}
        onColumnFiltersChange={store.setColumnFilters}
        columnVisibility={store.columnVisibility}
        onColumnVisibilityChange={store.setColumnVisibility}
        defaultColumnVisibility={QUOTES_DEFAULT_COLUMN_VISIBILITY}
        columnSizing={store.columnSizing}
        onColumnSizingChange={store.setColumnSizing}
      />

      {/* Quoter sheet for creating a new quote; refresh the list on close. */}
      <QuoterSheet
        open={newQuoteOpen}
        onOpenChange={(open) => {
          setNewQuoteOpen(open)
          if (!open) load()
        }}
      />
    </div>
  )
}
