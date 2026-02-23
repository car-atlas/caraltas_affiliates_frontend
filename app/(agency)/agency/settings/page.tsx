"use client"

import { useEffect, useState } from "react"
import { Save, Loader2, Building2, User, MapPin, CreditCard, Globe, CheckCircle2, XCircle, Pencil, MessageCircle, Plus, X } from "lucide-react"
import { agencyAPI, AgencyProfile, UpdateProfileRequest } from "@/lib/api"

export default function AgencySettings() {
  const [profile, setProfile] = useState<AgencyProfile | null>(null)
  const [formData, setFormData] = useState<UpdateProfileRequest>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await agencyAPI.getProfile()
      setProfile(data)
      setFormData({
        name: data.name || undefined,
        businessType: data.businessType || undefined,
        registrationNumber: data.registrationNumber || undefined,
        yearOfEstablishment: data.yearOfEstablishment || undefined,
        contactPersonName: data.contactPersonName || undefined,
        contactPhone: data.contactPhone || undefined,
        contactEmail: data.contactEmail || undefined,
        whatsappNumber: data.whatsappNumber || undefined,
        websiteUrl: data.websiteUrl || undefined,
        addressLine1: data.addressLine1 || undefined,
        addressLine2: data.addressLine2 || undefined,
        city: data.city || undefined,
        state: data.state || undefined,
        pincode: data.pincode || undefined,
        country: data.country || undefined,
        serviceAreas: data.serviceAreas || undefined,
        bankName: data.bankName || undefined,
        accountNumber: data.accountNumber || undefined,
        ifscCode: data.ifscCode || undefined,
        accountHolderName: data.accountHolderName || undefined,
        apiUrl: data.apiUrl || undefined,
        apiKey: data.apiKey || undefined,
        apiSources:
          data.apiSources && data.apiSources.length > 0
            ? data.apiSources.map((s) => ({
                id: s.id,
                name: s.name ?? undefined,
                apiUrl: s.apiUrl,
                apiKey: s.apiKey ?? undefined,
                order: s.order,
                isActive: s.isActive,
              }))
            : data.apiUrl
              ? [{ apiUrl: data.apiUrl, apiKey: data.apiKey ?? undefined, order: 0, isActive: true }]
              : undefined,
      })
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load profile")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setSaving(true)
      setError(null)
      setSuccess(null)
      const { panNumber: _pan, apiSources: rawSources, ...rest } = formData
      const apiSources =
        rawSources?.filter((s: any) => s?.apiUrl?.trim()).map((s: any, i: number) => ({
          id: s.id,
          name: s.name?.trim() || undefined,
          apiUrl: s.apiUrl.trim(),
          apiKey: s.apiKey?.trim() || undefined,
          order: i,
          isActive: true,
        })) ?? undefined
      await agencyAPI.updateProfile({ ...rest, apiSources })
      setSuccess("Profile updated successfully!")
      await loadProfile()
      setEditing(false)
      setTimeout(() => setSuccess(null), 3000)
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to update profile")
    } finally {
      setSaving(false)
    }
  }

  const handleInputChange = (field: keyof UpdateProfileRequest, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleServiceAreaChange = (index: number, value: string) => {
    const areas = formData.serviceAreas || []
    const newAreas = [...areas]
    newAreas[index] = value
    handleInputChange("serviceAreas", newAreas)
  }

  const addServiceArea = () => {
    handleInputChange("serviceAreas", [...(formData.serviceAreas || []), ""])
  }

  const removeServiceArea = (index: number) => {
    handleInputChange(
      "serviceAreas",
      (formData.serviceAreas || []).filter((_, i) => i !== index)
    )
  }

  const apiSourcesList = formData.apiSources ?? []
  const addApiSource = () =>
    handleInputChange("apiSources", [...apiSourcesList, { apiUrl: "", name: undefined, apiKey: undefined, order: apiSourcesList.length, isActive: true }])
  const removeApiSource = (index: number) =>
    handleInputChange("apiSources", apiSourcesList.filter((_, i) => i !== index))
  const updateApiSource = (index: number, field: "name" | "apiUrl" | "apiKey", value: string) =>
    handleInputChange(
      "apiSources",
      apiSourcesList.map((s, i) => (i === index ? { ...s, [field]: value || undefined } : s))
    )

  const cancelEdit = () => {
    setEditing(false)
    if (profile) {
      setFormData({
        name: profile.name || undefined,
        businessType: profile.businessType || undefined,
        registrationNumber: profile.registrationNumber || undefined,
        yearOfEstablishment: profile.yearOfEstablishment || undefined,
        contactPersonName: profile.contactPersonName || undefined,
        contactPhone: profile.contactPhone || undefined,
        contactEmail: profile.contactEmail || undefined,
        whatsappNumber: profile.whatsappNumber || undefined,
        websiteUrl: profile.websiteUrl || undefined,
        addressLine1: profile.addressLine1 || undefined,
        addressLine2: profile.addressLine2 || undefined,
        city: profile.city || undefined,
        state: profile.state || undefined,
        pincode: profile.pincode || undefined,
        country: profile.country || undefined,
        serviceAreas: profile.serviceAreas || undefined,
        bankName: profile.bankName || undefined,
        accountNumber: profile.accountNumber || undefined,
        ifscCode: profile.ifscCode || undefined,
        accountHolderName: profile.accountHolderName || undefined,
        apiUrl: profile.apiUrl || undefined,
        apiKey: profile.apiKey || undefined,
        apiSources:
          profile.apiSources && profile.apiSources.length > 0
            ? profile.apiSources.map((s) => ({
                id: s.id,
                name: s.name ?? undefined,
                apiUrl: s.apiUrl,
                apiKey: s.apiKey ?? undefined,
                order: s.order,
                isActive: s.isActive,
              }))
            : profile.apiUrl
              ? [{ apiUrl: profile.apiUrl, apiKey: profile.apiKey ?? undefined, order: 0, isActive: true }]
              : undefined,
      })
    }
  }

  const display = (v: string | number | undefined | null) => (v != null && String(v).trim() !== "" ? String(v) : "—")

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">
        <p>{error || "Failed to load profile"}</p>
      </div>
    )
  }

  const data = editing ? formData : { ...formData, ...profile }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Settings</h1>
        {!editing ? (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="inline-flex items-center gap-2 self-start rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90"
          >
            <Pencil className="h-4 w-4" />
            Edit
          </button>
        ) : null}
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 sm:p-4 text-red-700">
          <XCircle className="h-5 w-5 shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-3 sm:p-4 text-green-700">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          <p className="text-sm">{success}</p>
        </div>
      )}

      {editing ? (
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
            <h2 className="flex items-center gap-2 text-base font-semibold text-gray-900 sm:text-lg">
              <Building2 className="h-5 w-5 text-primary" />
              Business
            </h2>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600 sm:text-sm">Agency Name *</label>
                <input
                  type="text"
                  value={formData.name || ""}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600 sm:text-sm">Business Type</label>
                <input
                  type="text"
                  value={formData.businessType || ""}
                  onChange={(e) => handleInputChange("businessType", e.target.value)}
                  placeholder="e.g. Dealer, Broker"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500 sm:text-sm">GST Number</label>
                <input type="text" value={profile.gstNumber || ""} disabled className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500 sm:text-sm">PAN Number</label>
                <input type="text" value={profile.panNumber || ""} disabled className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600 sm:text-sm">Registration Number</label>
                <input
                  type="text"
                  value={formData.registrationNumber || ""}
                  onChange={(e) => handleInputChange("registrationNumber", e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600 sm:text-sm">Year of Establishment</label>
                <input
                  type="number"
                  value={formData.yearOfEstablishment ?? ""}
                  onChange={(e) => handleInputChange("yearOfEstablishment", e.target.value ? parseInt(e.target.value, 10) : undefined)}
                  min={1900}
                  max={new Date().getFullYear()}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
            <h2 className="flex items-center gap-2 text-base font-semibold text-gray-900 sm:text-lg">
              <User className="h-5 w-5 text-primary" />
              Contact
            </h2>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600 sm:text-sm">Contact Person</label>
                <input
                  type="text"
                  value={formData.contactPersonName || ""}
                  onChange={(e) => handleInputChange("contactPersonName", e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600 sm:text-sm">Contact Phone</label>
                <input
                  type="tel"
                  value={formData.contactPhone || ""}
                  onChange={(e) => handleInputChange("contactPhone", e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600 sm:text-sm">Contact Email *</label>
                <input
                  type="email"
                  value={formData.contactEmail || ""}
                  onChange={(e) => handleInputChange("contactEmail", e.target.value)}
                  required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600 sm:text-sm">
                  WhatsApp number
                  <span className="ml-1.5 text-gray-500 font-normal">(enables &quot;Message on WhatsApp&quot; on your listings)</span>
                </label>
                <input
                  type="tel"
                  value={formData.whatsappNumber || ""}
                  onChange={(e) => handleInputChange("whatsappNumber", e.target.value)}
                  placeholder="e.g. 919876543210"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
                />
                <p className="mt-1 text-xs text-gray-500">When set, users will see a WhatsApp button on your car listings.</p>
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-medium text-gray-600 sm:text-sm">Website</label>
                <input
                  type="url"
                  value={formData.websiteUrl || ""}
                  onChange={(e) => handleInputChange("websiteUrl", e.target.value)}
                  placeholder="https://"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
            <h2 className="flex items-center gap-2 text-base font-semibold text-gray-900 sm:text-lg">
              <MapPin className="h-5 w-5 text-primary" />
              Address
            </h2>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-medium text-gray-600 sm:text-sm">Address Line 1</label>
                <input
                  type="text"
                  value={formData.addressLine1 || ""}
                  onChange={(e) => handleInputChange("addressLine1", e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-medium text-gray-600 sm:text-sm">Address Line 2</label>
                <input
                  type="text"
                  value={formData.addressLine2 || ""}
                  onChange={(e) => handleInputChange("addressLine2", e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600 sm:text-sm">City</label>
                <input
                  type="text"
                  value={formData.city || ""}
                  onChange={(e) => handleInputChange("city", e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600 sm:text-sm">State</label>
                <input
                  type="text"
                  value={formData.state || ""}
                  onChange={(e) => handleInputChange("state", e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600 sm:text-sm">Pincode</label>
                <input
                  type="text"
                  value={formData.pincode || ""}
                  onChange={(e) => handleInputChange("pincode", e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600 sm:text-sm">Country</label>
                <input
                  type="text"
                  value={formData.country || ""}
                  onChange={(e) => handleInputChange("country", e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-medium text-gray-600 sm:text-sm">Service Areas</label>
                {(formData.serviceAreas || []).map((area, i) => (
                  <div key={i} className="mb-2 flex gap-2">
                    <input
                      type="text"
                      value={area}
                      onChange={(e) => handleServiceAreaChange(i, e.target.value)}
                      placeholder="City or region"
                      className="min-w-0 flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
                    />
                    <button type="button" onClick={() => removeServiceArea(i)} className="shrink-0 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-100">
                      Remove
                    </button>
                  </div>
                ))}
                <button type="button" onClick={addServiceArea} className="mt-2 rounded-lg bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200">
                  + Add area
                </button>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
            <h2 className="flex items-center gap-2 text-base font-semibold text-gray-900 sm:text-lg">
              <CreditCard className="h-5 w-5 text-primary" />
              Bank
            </h2>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600 sm:text-sm">Bank Name</label>
                <input
                  type="text"
                  value={formData.bankName || ""}
                  onChange={(e) => handleInputChange("bankName", e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600 sm:text-sm">Account Holder</label>
                <input
                  type="text"
                  value={formData.accountHolderName || ""}
                  onChange={(e) => handleInputChange("accountHolderName", e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600 sm:text-sm">Account Number</label>
                <input
                  type="text"
                  value={formData.accountNumber || ""}
                  onChange={(e) => handleInputChange("accountNumber", e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600 sm:text-sm">IFSC Code</label>
                <input
                  type="text"
                  value={formData.ifscCode || ""}
                  onChange={(e) => handleInputChange("ifscCode", e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
            <h2 className="flex items-center gap-2 text-base font-semibold text-gray-900 sm:text-lg">
              <Globe className="h-5 w-5 text-primary" />
              API sources
            </h2>
            <p className="mt-1 text-xs text-gray-500">Add one or more API URLs. Listings from all sources will sync.</p>
            <div className="mt-4 space-y-4">
              {apiSourcesList.map((source: any, index: number) => (
                <div key={source?.id ?? index} className="rounded-lg border border-gray-200 bg-gray-50/50 p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Source {index + 1}</span>
                    {apiSourcesList.length > 1 && (
                      <button type="button" onClick={() => removeApiSource(index)} className="text-red-600 hover:text-red-700 p-1" aria-label="Remove"><X size={14} /></button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs text-gray-600 mb-0.5">Label (optional)</label>
                      <input type="text" value={source?.name ?? ""} onChange={(e) => updateApiSource(index, "name", e.target.value)} placeholder="e.g. Cars24" className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm" />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs text-gray-600 mb-0.5">API URL *</label>
                      <input type="url" value={source?.apiUrl ?? ""} onChange={(e) => updateApiSource(index, "apiUrl", e.target.value)} placeholder="https://" className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-0.5">API Key (optional)</label>
                      <input type="password" value={source?.apiKey ?? ""} onChange={(e) => updateApiSource(index, "apiKey", e.target.value)} placeholder="Leave blank to keep" className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm" autoComplete="off" />
                    </div>
                  </div>
                </div>
              ))}
              <button type="button" onClick={addApiSource} className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-gray-300 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50">
                <Plus size={16} /> Add API source
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={cancelEdit}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save
            </button>
          </div>
        </form>
      ) : (
        <>
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
            <h2 className="flex items-center gap-2 text-base font-semibold text-gray-900 sm:text-lg">
              <Building2 className="h-5 w-5 text-primary" />
              Business
            </h2>
            <dl className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div><dt className="text-xs text-gray-500 sm:text-sm">Agency Name</dt><dd className="mt-0.5 font-medium text-gray-900">{display(data.name)}</dd></div>
              <div><dt className="text-xs text-gray-500 sm:text-sm">Business Type</dt><dd className="mt-0.5 text-gray-900">{display(data.businessType)}</dd></div>
              <div><dt className="text-xs text-gray-500 sm:text-sm">GST Number</dt><dd className="mt-0.5 text-gray-900">{display(profile.gstNumber)}</dd></div>
              <div><dt className="text-xs text-gray-500 sm:text-sm">PAN Number</dt><dd className="mt-0.5 text-gray-900">{display(profile.panNumber)}</dd></div>
              <div><dt className="text-xs text-gray-500 sm:text-sm">Registration Number</dt><dd className="mt-0.5 text-gray-900">{display(data.registrationNumber)}</dd></div>
              <div><dt className="text-xs text-gray-500 sm:text-sm">Year of Establishment</dt><dd className="mt-0.5 text-gray-900">{display(data.yearOfEstablishment)}</dd></div>
            </dl>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
            <h2 className="flex items-center gap-2 text-base font-semibold text-gray-900 sm:text-lg">
              <User className="h-5 w-5 text-primary" />
              Contact
            </h2>
            <dl className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div><dt className="text-xs text-gray-500 sm:text-sm">Contact Person</dt><dd className="mt-0.5 text-gray-900">{display(data.contactPersonName)}</dd></div>
              <div><dt className="text-xs text-gray-500 sm:text-sm">Contact Phone</dt><dd className="mt-0.5 text-gray-900">{display(data.contactPhone)}</dd></div>
              <div><dt className="text-xs text-gray-500 sm:text-sm">Contact Email</dt><dd className="mt-0.5 text-gray-900">{display(data.contactEmail)}</dd></div>
              <div>
                <dt className="text-xs text-gray-500 sm:text-sm">WhatsApp</dt>
                <dd className="mt-0.5 flex items-center gap-2 flex-wrap">
                  <span className="text-gray-900">{display(data.whatsappNumber)}</span>
                  {(data.whatsappNumber && String(data.whatsappNumber).trim()) ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                      <MessageCircle size={12} /> Enabled for listings
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">Not set</span>
                  )}
                </dd>
              </div>
              <div className="sm:col-span-2"><dt className="text-xs text-gray-500 sm:text-sm">Website</dt><dd className="mt-0.5 text-gray-900 break-all">{display(data.websiteUrl)}</dd></div>
            </dl>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
            <h2 className="flex items-center gap-2 text-base font-semibold text-gray-900 sm:text-lg">
              <MapPin className="h-5 w-5 text-primary" />
              Address
            </h2>
            <dl className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2"><dt className="text-xs text-gray-500 sm:text-sm">Address Line 1</dt><dd className="mt-0.5 text-gray-900">{display(data.addressLine1)}</dd></div>
              <div className="sm:col-span-2"><dt className="text-xs text-gray-500 sm:text-sm">Address Line 2</dt><dd className="mt-0.5 text-gray-900">{display(data.addressLine2)}</dd></div>
              <div><dt className="text-xs text-gray-500 sm:text-sm">City</dt><dd className="mt-0.5 text-gray-900">{display(data.city)}</dd></div>
              <div><dt className="text-xs text-gray-500 sm:text-sm">State</dt><dd className="mt-0.5 text-gray-900">{display(data.state)}</dd></div>
              <div><dt className="text-xs text-gray-500 sm:text-sm">Pincode</dt><dd className="mt-0.5 text-gray-900">{display(data.pincode)}</dd></div>
              <div><dt className="text-xs text-gray-500 sm:text-sm">Country</dt><dd className="mt-0.5 text-gray-900">{display(data.country)}</dd></div>
              {(data.serviceAreas as string[] | undefined)?.length ? (
                <div className="sm:col-span-2"><dt className="text-xs text-gray-500 sm:text-sm">Service Areas</dt><dd className="mt-0.5 text-gray-900">{(data.serviceAreas as string[]).join(", ")}</dd></div>
              ) : null}
            </dl>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
            <h2 className="flex items-center gap-2 text-base font-semibold text-gray-900 sm:text-lg">
              <CreditCard className="h-5 w-5 text-primary" />
              Bank
            </h2>
            <dl className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div><dt className="text-xs text-gray-500 sm:text-sm">Bank Name</dt><dd className="mt-0.5 text-gray-900">{display(data.bankName)}</dd></div>
              <div><dt className="text-xs text-gray-500 sm:text-sm">Account Holder</dt><dd className="mt-0.5 text-gray-900">{display(data.accountHolderName)}</dd></div>
              <div><dt className="text-xs text-gray-500 sm:text-sm">Account Number</dt><dd className="mt-0.5 text-gray-900">{display(data.accountNumber)}</dd></div>
              <div><dt className="text-xs text-gray-500 sm:text-sm">IFSC Code</dt><dd className="mt-0.5 text-gray-900">{display(data.ifscCode)}</dd></div>
            </dl>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
            <h2 className="flex items-center gap-2 text-base font-semibold text-gray-900 sm:text-lg">
              <Globe className="h-5 w-5 text-primary" />
              API sources
            </h2>
            <dl className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {(data.apiSources as Array<{ name?: string | null; apiUrl: string }> | undefined)?.length ? (
                (data.apiSources as Array<{ name?: string | null; apiUrl: string }>).map((s, i) => (
                  <div key={i} className="sm:col-span-2">
                    <dt className="text-xs text-gray-500 sm:text-sm">{s.name ? `${s.name}` : `Source ${i + 1}`}</dt>
                    <dd className="mt-0.5 break-all text-gray-900">{display(s.apiUrl)}</dd>
                  </div>
                ))
              ) : (
                <div className="sm:col-span-2"><dt className="text-xs text-gray-500 sm:text-sm">API URL</dt><dd className="mt-0.5 break-all text-gray-900">{display(data.apiUrl)}</dd></div>
              )}
              <div><dt className="text-xs text-gray-500 sm:text-sm">Integration</dt><dd className="mt-0.5 text-gray-900">{display(profile.integrationType)}</dd></div>
            </dl>
          </div>

          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 sm:p-5">
            <h2 className="text-base font-semibold text-gray-900 sm:text-lg">Account</h2>
            <dl className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <div><dt className="text-xs text-gray-500 sm:text-sm">Email</dt><dd className="mt-0.5 text-gray-900">{display(profile.email)}</dd></div>
              <div><dt className="text-xs text-gray-500 sm:text-sm">Status</dt><dd className="mt-0.5"><span className={`font-medium ${profile.approvalStatus === "APPROVED" ? "text-green-600" : profile.approvalStatus === "PENDING" ? "text-amber-600" : "text-red-600"}`}>{profile.approvalStatus}</span></dd></div>
              <div><dt className="text-xs text-gray-500 sm:text-sm">Integration</dt><dd className="mt-0.5 text-gray-900">{display(profile.integrationType)}</dd></div>
              <div><dt className="text-xs text-gray-500 sm:text-sm">CPC</dt><dd className="mt-0.5 text-gray-900">₹{profile.cpc ?? 0}</dd></div>
              <div><dt className="text-xs text-gray-500 sm:text-sm">Active Listings</dt><dd className="mt-0.5 text-gray-900">{profile.activeListings ?? 0}</dd></div>
              <div><dt className="text-xs text-gray-500 sm:text-sm">Member Since</dt><dd className="mt-0.5 text-gray-900">{profile.createdAt ? new Date(profile.createdAt).toLocaleDateString() : "—"}</dd></div>
            </dl>
          </div>
        </>
      )}
    </div>
  )
}
