"use client"

import { useEffect, useState, type FormEvent } from "react"
import { agencyAPI, type AgencyBill } from "@/lib/api"
import { Wallet, Loader2, FileText, CreditCard, Plus } from "lucide-react"

function getStoredAgencyId(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem("agency_id")
}

export default function AgencyWalletPage() {
  const [balance, setBalance] = useState<number | null>(null)
  const [bills, setBills] = useState<AgencyBill[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [payingId, setPayingId] = useState<string | null>(null)
  const [topUpAmount, setTopUpAmount] = useState("")
  const [toppingUp, setToppingUp] = useState(false)

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)
      const [walletRes, billsRes] = await Promise.all([
        agencyAPI.getWallet(),
        agencyAPI.getBills(),
      ])
      setBalance(walletRes?.balance ?? 0)
      setBills(billsRes?.bills ?? [])
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string } } }
      setError(ax?.response?.data?.message || "Failed to load wallet and bills")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const id = getStoredAgencyId()
    if (!id) {
      setError("You are not signed in. Please log in.")
      setLoading(false)
      return
    }
    loadData()
  }, [])

  const handleTopUp = async (e: FormEvent) => {
    e.preventDefault()
    const amount = parseFloat(topUpAmount)
    if (!Number.isFinite(amount) || amount <= 0) return
    try {
      setToppingUp(true)
      await agencyAPI.topUpWallet(amount)
      setTopUpAmount("")
      await loadData()
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string } } }
      alert(ax?.response?.data?.message || "Failed to top up")
    } finally {
      setToppingUp(false)
    }
  }

  const handlePayBill = async (billId: string) => {
    try {
      setPayingId(billId)
      await agencyAPI.payBill(billId)
      await loadData()
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string } } }
      alert(ax?.response?.data?.message || "Failed to pay bill")
    } finally {
      setPayingId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl flex items-center gap-2">
          <Wallet className="w-8 h-8 text-primary" />
          Wallet & Bills
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          Pay your generated bills from your wallet. Top up when needed (payment gateway coming soon).
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-800">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-primary" />
              Wallet balance
            </h2>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            ₹{balance != null ? Number(balance).toLocaleString("en-IN", { minimumFractionDigits: 2 }) : "—"}
          </p>
          <p className="text-sm text-gray-500 mt-2">Add test balance (Razorpay coming later).</p>
          <form onSubmit={handleTopUp} className="mt-3 flex flex-wrap items-center gap-2">
            <input
              type="number"
              min={1}
              step="any"
              placeholder="Amount"
              value={topUpAmount}
              onChange={(e) => setTopUpAmount(e.target.value)}
              className="w-28 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <button
              type="submit"
              disabled={toppingUp || !topUpAmount}
              className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {toppingUp ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Add balance
            </button>
          </form>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h2 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Your bills
          </h2>
          <p className="text-sm text-gray-500">
            Platform generates bills per period (e.g. monthly). Pay from wallet when balance is sufficient.
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="border-b border-border px-4 py-3 sm:px-5">
          <h2 className="font-semibold text-gray-900">Bills</h2>
          <p className="text-sm text-gray-500 mt-0.5">Generated by platform. Pay with wallet.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="px-6 py-3 text-left font-medium text-gray-700">Period</th>
                <th className="px-6 py-3 text-right font-medium text-gray-700">Amount (₹)</th>
                <th className="px-6 py-3 text-left font-medium text-gray-700">Status</th>
                <th className="px-6 py-3 text-left font-medium text-gray-700">Paid at</th>
                <th className="px-6 py-3 text-left font-medium text-gray-700">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {bills.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    No bills yet. Platform admin generates bills per period.
                  </td>
                </tr>
              ) : (
                bills.map((bill) => (
                  <tr key={bill.id} className="hover:bg-muted/30">
                    <td className="px-6 py-4 font-medium text-gray-900">{bill.periodLabel}</td>
                    <td className="px-6 py-4 text-right">
                      {Number(bill.amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                          bill.status === "PAID" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {bill.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {bill.paidAt ? new Date(bill.paidAt).toLocaleString() : "—"}
                    </td>
                    <td className="px-6 py-4">
                      {bill.status === "PENDING" && (
                        <button
                          type="button"
                          onClick={() => handlePayBill(bill.id)}
                          disabled={payingId !== null || (balance != null && balance < bill.amount)}
                          className="text-sm font-medium text-primary hover:underline disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-1"
                        >
                          {payingId === bill.id ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                          Pay with wallet
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
