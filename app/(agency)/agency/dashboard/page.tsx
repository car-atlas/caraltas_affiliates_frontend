"use client"

import { useEffect, useState } from "react"
import { Car, MousePointerClick, BarChart3, Loader2, TrendingUp, TrendingDown, ArrowRight, Settings, UserPlus, Wallet } from "lucide-react"
import Link from "next/link"
import { agencyAPI, DashboardSummary, AgencyProfile } from "@/lib/api"

function getStoredAgencyId(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem("agency_id")
}

function formatNum(n: number) {
  return new Intl.NumberFormat("en-IN").format(n)
}

function formatTime(s: string) {
  return new Date(s).toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
}

function pctChange(current: number, previous: number) {
  if (previous === 0) return current > 0 ? 100 : 0
  return Math.round(((current - previous) / previous) * 100)
}

export default function AgencyDashboard() {
  const [agency, setAgency] = useState<AgencyProfile | null>(null)
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    const id = getStoredAgencyId()
    if (!id) {
      setError("You are not signed in as an agency. Please log in.")
      setLoading(false)
      return
    }
    Promise.all([agencyAPI.getProfile().catch(() => null), agencyAPI.getDashboardSummary(id).catch(() => null)])
      .then(([profile, data]) => {
        if (cancelled) return
        if (!profile) {
          setError("Could not load your agency. Please sign in again.")
        } else {
          setAgency(profile)
          setSummary(data ?? null)
        }
      })
      .catch(() => {
        if (!cancelled) setError("Failed to load dashboard. Please try again.")
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [])

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    )
  }

  if (error || !agency) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-800">
        <p className="font-medium">{error ?? "You are not signed in as an agency."}</p>
        <Link href="/auth/login" className="mt-3 inline-block text-sm font-semibold text-primary hover:underline">
          Go to sign in
        </Link>
      </div>
    )
  }

  const hasActivity = (summary?.topListings?.length ?? 0) > 0 || (summary?.recentClicks?.length ?? 0) > 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-600">Welcome back, {agency.name}</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-6">
        <Link
          href="/agency/listings"
          className="flex flex-col justify-between rounded-xl border border-border bg-card p-4 shadow-sm transition hover:border-primary hover:shadow md:p-5"
        >
          <p className="text-xs text-gray-500 sm:text-sm">Listings</p>
          <p className="mt-1 text-xl font-bold text-gray-900 sm:text-2xl">
            {formatNum(summary?.activeListings ?? agency.activeListings ?? 0)}
          </p>
          <div className="mt-2 flex h-9 w-9 items-center justify-center rounded-lg bg-green-100 sm:h-10 sm:w-10">
            <Car className="h-5 w-5 text-green-600 sm:h-6 sm:w-6" />
          </div>
        </Link>

        <Link
          href="/agency/analytics"
          className="flex flex-col justify-between rounded-xl border border-border bg-card p-4 shadow-sm transition hover:border-primary hover:shadow md:p-5"
        >
          <p className="text-xs text-gray-500 sm:text-sm">Clicks (all time)</p>
          <p className="mt-1 text-xl font-bold text-gray-900 sm:text-2xl">{formatNum(summary?.totalClicks ?? 0)}</p>
          <div className="mt-2 flex h-9 w-9 items-center justify-center rounded-lg bg-purple-100 sm:h-10 sm:w-10">
            <MousePointerClick className="h-5 w-5 text-purple-600 sm:h-6 sm:w-6" />
          </div>
        </Link>

        <Link
          href="/agency/analytics"
          className="flex flex-col justify-between rounded-xl border border-border bg-card p-4 shadow-sm transition hover:border-primary hover:shadow md:p-5"
        >
          <p className="text-xs text-gray-500 sm:text-sm">Leads (all time)</p>
          <p className="mt-1 text-xl font-bold text-gray-900 sm:text-2xl">{formatNum(summary?.totalLeads ?? 0)}</p>
          <div className="mt-2 flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 sm:h-10 sm:w-10">
            <UserPlus className="h-5 w-5 text-emerald-600 sm:h-6 sm:w-6" />
          </div>
        </Link>

        <div className="flex flex-col justify-between rounded-xl border border-border bg-card p-4 shadow-sm md:p-5">
          <p className="text-xs text-gray-500 sm:text-sm">Bill (all time)</p>
          <p className="mt-1 text-xl font-bold text-gray-900 sm:text-2xl">
            ₹{formatNum(Math.round(summary?.totalBill ?? 0))}
          </p>
          <div className="mt-2 flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 sm:h-10 sm:w-10">
            <MousePointerClick className="h-5 w-5 text-amber-600 sm:h-6 sm:w-6" />
          </div>
        </div>

        <div className="flex flex-col justify-between rounded-xl border border-border bg-card p-4 shadow-sm md:p-5">
          <p className="text-xs text-gray-500 sm:text-sm">CPL (per lead, 15-day window)</p>
          <p className="mt-1 text-xl font-bold text-gray-900 sm:text-2xl">
            {summary != null ? `₹${Number(summary.cpl ?? 0).toFixed(2)}` : "—"}
          </p>
          <div className="mt-2 flex h-9 w-9 items-center justify-center rounded-lg bg-sky-100 sm:h-10 sm:w-10">
            <UserPlus className="h-5 w-5 text-sky-600 sm:h-6 sm:w-6" />
          </div>
        </div>
      </div>

      {summary && (
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm sm:p-5">
          <h2 className="text-sm font-semibold text-gray-700">This period</h2>
          <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-xs text-gray-500">Today (clicks)</p>
              <div className="mt-0.5 flex items-center gap-2">
                <span className="text-lg font-semibold text-gray-900">{formatNum(summary.todayClicks)}</span>
                {summary.yesterdayClicks > 0 && (
                  <span
                    className={
                      summary.todayClicks >= summary.yesterdayClicks ? "text-green-600" : "text-red-600"
                    }
                  >
                    {summary.todayClicks >= summary.yesterdayClicks ? (
                      <TrendingUp className="inline h-4 w-4" />
                    ) : (
                      <TrendingDown className="inline h-4 w-4" />
                    )}{" "}
                    {pctChange(summary.todayClicks, summary.yesterdayClicks)}%
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-400">vs yesterday</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">This week</p>
              <div className="mt-0.5 flex items-center gap-2">
                <span className="text-lg font-semibold text-gray-900">{formatNum(summary.weekClicks)}</span>
                {summary.lastWeekClicks > 0 && (
                  <span
                    className={
                      summary.weekClicks >= summary.lastWeekClicks ? "text-green-600" : "text-red-600"
                    }
                  >
                    {summary.weekClicks >= summary.lastWeekClicks ? (
                      <TrendingUp className="inline h-4 w-4" />
                    ) : (
                      <TrendingDown className="inline h-4 w-4" />
                    )}{" "}
                    {pctChange(summary.weekClicks, summary.lastWeekClicks)}%
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-400">vs last week</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Leads (this week)</p>
              <p className="mt-0.5 text-lg font-semibold text-gray-900">{formatNum(summary.weekLeads ?? 0)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Month bill</p>
              <div className="mt-0.5 flex items-center gap-2">
                <span className="text-lg font-semibold text-gray-900">
                  ₹{formatNum(Math.round(summary.monthBill))}
                </span>
                {summary.lastMonthBill > 0 && (
                  <span
                    className={
                      summary.monthBill >= summary.lastMonthBill ? "text-green-600" : "text-red-600"
                    }
                  >
                    {pctChange(summary.monthBill, summary.lastMonthBill)}%
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-400">vs last month</p>
            </div>
          </div>
        </div>
      )}

      {summary && hasActivity && (
        <div className="rounded-xl border border-border bg-card shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 sm:px-5">
            <h2 className="text-sm font-semibold text-gray-900">Recent activity</h2>
            <Link
              href="/agency/analytics"
              className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
            >
              Analytics <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="divide-y divide-gray-100">
            {summary.topListings?.slice(0, 3).map((l) => (
              <div
                key={l.id}
                className="flex items-center justify-between px-4 py-3 sm:px-5"
              >
                <span className="text-sm font-medium text-gray-900">
                  {l.brand} {l.model} ({l.year})
                </span>
                <span className="text-xs text-gray-500">{formatNum(l.clicks)} clicks</span>
              </div>
            ))}
            {summary.recentClicks?.slice(0, 5).map((c) => (
              <div key={c.id} className="flex items-center justify-between px-4 py-2.5 sm:px-5">
                <span className="text-sm text-gray-700">
                  {c.listing
                    ? `${c.listing.brand} ${c.listing.model} (${c.listing.year})`
                    : "External listing"}
                </span>
                <span className="text-xs text-gray-400">{formatTime(c.createdAt)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-xl border border-border bg-card p-4 shadow-sm sm:p-5">
        <h2 className="text-sm font-semibold text-gray-900">Quick actions</h2>
        <div className="mt-3 flex flex-wrap gap-3">
          <Link
            href="/agency/listings"
            className="flex min-h-[56px] min-w-[140px] items-center gap-3 rounded-lg border border-gray-200 p-3 transition hover:border-primary hover:bg-primary/5"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <Car className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">Listings</p>
              <p className="text-xs text-gray-500">Add or edit</p>
            </div>
          </Link>
          <Link
            href="/agency/analytics"
            className="flex min-h-[56px] min-w-[140px] items-center gap-3 rounded-lg border border-gray-200 p-3 transition hover:border-primary hover:bg-primary/5"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <BarChart3 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">Analytics</p>
              <p className="text-xs text-gray-500">Clicks & cost</p>
            </div>
          </Link>
          <Link
            href="/agency/wallet"
            className="flex min-h-[56px] min-w-[140px] items-center gap-3 rounded-lg border border-gray-200 p-3 transition hover:border-primary hover:bg-primary/5"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <Wallet className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">Wallet & Bills</p>
              <p className="text-xs text-gray-500">Pay your bills</p>
            </div>
          </Link>
          <Link
            href="/agency/settings"
            className="flex min-h-[56px] min-w-[140px] items-center gap-3 rounded-lg border border-gray-200 p-3 transition hover:border-primary hover:bg-primary/5"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100">
              <Settings className="h-5 w-5 text-gray-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">Settings</p>
              <p className="text-xs text-gray-500">Profile</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}
