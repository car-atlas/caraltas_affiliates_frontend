"use client"

import { useEffect, useState } from "react"
import { BarChart3, Loader2, Calendar, Download } from "lucide-react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts"
import { agencyAPI, ClickStats } from "@/lib/api"
import Link from "next/link"

function getStoredAgencyId(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem("agency_id")
}

type Range = "today" | "7days" | "30days" | "90days" | "custom"

function toLocalDateStr(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

function getRangeDates(range: Range, customStart: string, customEnd: string) {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  switch (range) {
    case "today":
      return { start: today, end: new Date() }
    case "7days": {
      const s = new Date(today)
      s.setDate(s.getDate() - 7)
      return { start: s, end: new Date() }
    }
    case "30days": {
      const s = new Date(today)
      s.setDate(s.getDate() - 30)
      return { start: s, end: new Date() }
    }
    case "90days": {
      const s = new Date(today)
      s.setDate(s.getDate() - 90)
      return { start: s, end: new Date() }
    }
    case "custom":
      return {
        start: customStart ? new Date(customStart + "T12:00:00") : undefined,
        end: customEnd ? new Date(customEnd + "T12:00:00") : undefined,
      }
    default:
      return {}
  }
}

function getDateRangeStrings(range: Range, customStart: string, customEnd: string) {
  const { start, end } = getRangeDates(range, customStart, customEnd)
  if (!start || !end) return { startStr: undefined, endStr: undefined }
  return { startStr: toLocalDateStr(start), endStr: toLocalDateStr(end) }
}

function getDaysInRange(startStr: string, endStr: string): string[] {
  const start = new Date(startStr + "T12:00:00")
  const end = new Date(endStr + "T12:00:00")
  const out: string[] = []
  const d = new Date(start)
  while (d <= end) {
    out.push(toLocalDateStr(d))
    d.setDate(d.getDate() + 1)
  }
  return out
}

function formatNum(n: number) {
  return new Intl.NumberFormat("en-IN").format(n)
}

function formatDate(s: string) {
  return new Date(s).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
}

const RANGE_LABELS: Record<Exclude<Range, "custom">, string> = {
  today: "Today",
  "7days": "Last 7 days",
  "30days": "Last 30 days",
  "90days": "Last 90 days",
}

export default function AnalyticsPage() {
  const [stats, setStats] = useState<ClickStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [range, setRange] = useState<Range>("30days")
  const [customStart, setCustomStart] = useState("")
  const [customEnd, setCustomEnd] = useState("")

  const { startStr, endStr } = getDateRangeStrings(range, customStart, customEnd)

  useEffect(() => {
    const id = getStoredAgencyId()
    if (!id) {
      setError("You are not signed in as an agency. Please log in.")
      setLoading(false)
      return
    }
    if (range === "custom" && (!startStr || !endStr)) {
      setLoading(false)
      return
    }
    if (!startStr || !endStr) {
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    agencyAPI
      .getClickStats(id, startStr, endStr)
      .then(setStats)
      .catch((err: any) => {
        setError(err.response?.data?.message || "Failed to load analytics.")
      })
      .finally(() => setLoading(false))
  }, [range, customStart, customEnd, startStr, endStr])

  const chartData =
    startStr && endStr
      ? getDaysInRange(startStr, endStr).map((date) => ({
          date,
          short: formatDate(date),
          clicks: stats?.clicksByDate?.[date] ?? 0,
        }))
      : []

  const escapeCsvCell = (v: string | number): string => {
    const s = String(v)
    if (/[,\n"]/.test(s)) return `"${s.replace(/"/g, '""')}"`
    return s
  }

  const exportSpreadsheet = () => {
    if (!stats) return
    const dateRows = Object.entries(stats.clicksByDate || {})
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([d, c]) => [d, String(c)])
    const summaryRows = [
      ["Metric", "Value"],
      ["Total Clicks", String(stats.totalClicks)],
      ["Total Leads", String(stats.totalLeads ?? 0)],
      ["Total Cost", `₹${stats.totalCost.toFixed(2)}`],
      ["CPL", stats != null ? `₹${Number(stats.cpl ?? 0).toFixed(2)}` : "—"],
      [],
      ["Date", "Clicks"],
      ...dateRows,
    ]
    const listingRows = [
      [],
      ["Listing", "Clicks", "Leads", "Cost (₹)"],
      ...(stats.clicksByListing || []).map((row) => {
        const clicks = row._count?.id ?? 0
        const leads = stats.leadsByListing?.find((l) => l.listingId === row.listingId)?._count?.id ?? 0
        return [
          row.listingId ? String(row.listingId).slice(0, 8) + "…" : "External",
          String(clicks),
          String(leads),
          String(((stats.leadsByListing?.find((l) => l.listingId === row.listingId)?._count?.id ?? 0) * (stats.cpl ?? 0)).toFixed(2)),
        ]
      }),
    ]
    const allRows = [...summaryRows, ...listingRows]
    const csv = "\uFEFF" + allRows.map((r) => r.map(escapeCsvCell).join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" })
    const a = document.createElement("a")
    a.href = URL.createObjectURL(blob)
    a.download = `analytics-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  if (loading && !stats) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-800">
        <p className="font-medium">{error}</p>
        <Link href="/auth/login" className="mt-3 inline-block text-sm font-semibold text-primary hover:underline">
          Go to sign in
        </Link>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="rounded-xl border border-gray-200 bg-gray-50 p-6 text-gray-600">
        <p>No analytics for the selected period. Choose a date range or try again later.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Analytics</h1>
        </div>
        <button
          type="button"
          onClick={exportSpreadsheet}
          className="inline-flex items-center gap-2 self-start rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90"
        >
          <Download className="h-4 w-4" />
          Export spreadsheet
        </button>
      </div>

      <div className="rounded-xl border border-border bg-card p-4 shadow-sm sm:p-5">
        <p className="text-sm font-semibold text-gray-700">Date range</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {(["today", "7days", "30days", "90days"] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRange(r)}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                range === r ? "bg-primary text-primary-foreground" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {RANGE_LABELS[r]}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setRange("custom")}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition ${
              range === "custom" ? "bg-primary text-primary-foreground" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            <Calendar className="h-4 w-4" />
            Custom
          </button>
        </div>
        {range === "custom" && (
          <div className="mt-4 flex flex-wrap gap-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Start</label>
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">End</label>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm sm:p-5">
          <p className="text-xs text-gray-500">Clicks (period)</p>
          <p className="mt-1 text-2xl font-bold text-gray-900 sm:text-3xl">{formatNum(stats.totalClicks)}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm sm:p-5">
          <p className="text-xs text-gray-500">Leads (period)</p>
          <p className="mt-1 text-2xl font-bold text-gray-900 sm:text-3xl">{formatNum(stats.totalLeads ?? 0)}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm sm:p-5">
          <p className="text-xs text-gray-500">Cost (period)</p>
          <p className="mt-1 text-2xl font-bold text-gray-900 sm:text-3xl">
            ₹{formatNum(Math.round(stats.totalCost))}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm sm:p-5">
          <p className="text-xs text-gray-500">CPL (per lead, 15-day window)</p>
          <p className="mt-1 text-2xl font-bold text-gray-900 sm:text-3xl">
            {stats != null ? `₹${Number(stats.cpl ?? 0).toFixed(2)}` : "—"}
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-4 shadow-sm sm:p-5">
        <h2 className="text-sm font-semibold text-gray-900">Clicks over time</h2>
        <div className="mt-4 h-[280px] w-full">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{ top: 12, right: 12, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200" />
                <XAxis
                  dataKey="short"
                  tick={{ fontSize: 11, fill: "#6b7280" }}
                  axisLine={{ stroke: "#e5e7eb" }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#6b7280" }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb" }}
                  labelFormatter={(_, payload) => payload?.[0]?.payload?.date}
                  formatter={(value: number) => [formatNum(value), "Clicks"]}
                />
                <Line
                  type="monotone"
                  dataKey="clicks"
                  name="Clicks"
                  stroke={chartData.every((d) => d.clicks === 0) ? "transparent" : "var(--primary)"}
                  strokeWidth={2}
                  dot={chartData.every((d) => d.clicks === 0) ? false : { fill: "var(--primary)", r: 3 }}
                  activeDot={{ r: 5 }}
                  connectNulls
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-gray-400">Select date range</div>
          )}
        </div>
      </div>

      {stats.clicksByListing?.length > 0 && (
        <div className="rounded-xl border border-border bg-card shadow-sm">
          <h2 className="border-b border-gray-100 px-4 py-3 text-sm font-semibold text-gray-900 sm:px-5">
            Clicks & leads by listing
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/80">
                  <th className="px-4 py-3 text-left font-medium text-gray-600 sm:px-5">Listing</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-600 sm:px-5">Clicks</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-600 sm:px-5">Leads</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-600 sm:px-5">Cost (₹)</th>
                </tr>
              </thead>
              <tbody>
                {stats.clicksByListing.map((row, i) => {
                  const clicks = row._count?.id ?? 0
                  const leads = stats.leadsByListing?.find((l) => l.listingId === row.listingId)?._count?.id ?? 0
                  return (
                    <tr key={row.listingId || `row-${i}`} className="border-b border-gray-50">
                      <td className="px-4 py-3 text-gray-900 sm:px-5">
                        {row.listingId ? (
                          <span className="font-mono text-xs">{String(row.listingId).slice(0, 8)}…</span>
                        ) : (
                          <span className="text-gray-500">External</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-gray-900 sm:px-5">
                        {formatNum(clicks)}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-700 sm:px-5">{formatNum(leads)}</td>
                      <td className="px-4 py-3 text-right text-gray-700 sm:px-5">
                        ₹{formatNum((stats.cpl ?? 0) * (stats.leadsByListing?.find((l) => l.listingId === row.listingId)?._count?.id ?? 0))}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
