"use client"

import { useEffect, useState } from "react"
import { Car, Plus, Loader2, Link2, ExternalLink, X, Image as ImageIcon, Pencil, Trash2, MessageCircle, RefreshCw } from "lucide-react"
import Link from "next/link"
import { agencyAPI, type Listing, type CreateListingRequest } from "@/lib/api"

const FUEL_OPTIONS = ["Petrol", "Diesel", "CNG", "Electric", "Hybrid"]
const TRANSMISSION_OPTIONS = ["Manual", "Automatic", "AMT", "CVT", "DCT"]
const BODY_OPTIONS = ["Sedan", "Hatchback", "SUV", "MUV", "Coupe", "Convertible"]

function ImageWithFallback({ src, alt }: { src: string; alt: string }) {
  const [imageError, setImageError] = useState(false)

  if (imageError) {
    return (
      <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
        <ImageIcon size={24} className="text-gray-400" />
      </div>
    )
  }

  return (
    <img
      src={src}
      alt={alt}
      className="w-16 h-16 object-cover rounded-lg border border-gray-200"
      onError={() => setImageError(true)}
    />
  )
}

const initialForm: CreateListingRequest = {
  brand: "",
  model: "",
  variant: "",
  year: new Date().getFullYear(),
  mileage: 0,
  price: 0,
  currency: "INR",
  color: "",
  fuelType: "",
  transmission: "",
  bodyType: "",
  city: "",
  state: "",
  country: "India",
  externalUrl: "",
  ownership: "",
  isAvailable: true,
}

export default function ListingsPage() {
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [form, setForm] = useState<CreateListingRequest>(initialForm)
  const [selectedImages, setSelectedImages] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [uploadingImages, setUploadingImages] = useState(false)
  type ApiSourceRow = { id?: string; name: string; apiUrl: string; apiKey: string }
  const [apiSources, setApiSources] = useState<ApiSourceRow[]>([])
  const [apiSaving, setApiSaving] = useState(false)
  const [syncNowLoading, setSyncNowLoading] = useState(false)
  const [apiMessage, setApiMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [whatsappNumber, setWhatsappNumber] = useState<string | null>(null)
  const [editingListing, setEditingListing] = useState<Listing | null>(null)
  const [editForm, setEditForm] = useState<CreateListingRequest>(initialForm)
  const [editSubmitting, setEditSubmitting] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    loadListings()
    loadProfileForApi()
  }, [])

  const loadProfileForApi = async () => {
    try {
      const profile = await agencyAPI.getProfile()
      setWhatsappNumber(profile.whatsappNumber ?? null)
      if (profile.apiSources && profile.apiSources.length > 0) {
        setApiSources(
          profile.apiSources.map((s) => ({
            id: s.id,
            name: s.name ?? "",
            apiUrl: s.apiUrl,
            apiKey: s.apiKey ?? "",
          }))
        )
      } else if (profile.apiUrl) {
        setApiSources([{ name: "", apiUrl: profile.apiUrl, apiKey: "" }])
      } else {
        setApiSources([])
      }
    } catch {
    }
  }

  const loadListings = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await agencyAPI.getListings()
      setListings(data)
    } catch (err) {
      console.error("Error loading listings:", err)
      if ((err as any)?.response?.status === 401) {
        setError("Please sign in again.")
      } else {
        setError("Failed to load listings. Please try again.")
      }
    } finally {
      setLoading(false)
    }
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    const validFiles = files.filter((file) => {
      if (!file.type.startsWith('image/')) {
        setFormError(`File ${file.name} is not an image.`)
        return false
      }
      if (file.size > 5 * 1024 * 1024) {
        setFormError(`File ${file.name} is too large. Maximum size is 5MB.`)
        return false
      }
      return true
    })

    if (validFiles.length === 0) return

    const newFiles = [...selectedImages, ...validFiles].slice(0, 10) // Max 10 images
    setSelectedImages(newFiles)

    // Create previews
    const newPreviews: string[] = []
    newFiles.forEach((file) => {
      const reader = new FileReader()
      reader.onloadend = () => {
        if (reader.result) {
          newPreviews.push(reader.result as string)
          if (newPreviews.length === newFiles.length) {
            setImagePreviews(newPreviews)
          }
        }
      }
      reader.readAsDataURL(file)
    })
  }

  const removeImage = (index: number) => {
    const newFiles = selectedImages.filter((_, i) => i !== index)
    const newPreviews = imagePreviews.filter((_, i) => i !== index)
    setSelectedImages(newFiles)
    setImagePreviews(newPreviews)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)
    if (!form.brand?.trim() || !form.model?.trim()) {
      setFormError("Brand and Model are required.")
      return
    }
    if (!form.year || form.year < 1900 || form.year > new Date().getFullYear() + 1) {
      setFormError("Please enter a valid year.")
      return
    }
    if (form.mileage < 0 || form.price < 0) {
      setFormError("Mileage and price must be non-negative.")
      return
    }
    try {
      setSubmitting(true)
      
      // Upload images first if any
      let imageUrls: string[] = []
      if (selectedImages.length > 0) {
        setUploadingImages(true)
        try {
          const uploadResult = await agencyAPI.uploadImages(selectedImages)
          imageUrls = uploadResult.images
        } catch (uploadErr) {
          setFormError("Failed to upload images. Please try again.")
          setUploadingImages(false)
          setSubmitting(false)
          return
        }
        setUploadingImages(false)
      }

      await agencyAPI.createListing({
        brand: form.brand.trim(),
        model: form.model.trim(),
        variant: form.variant?.trim() || undefined,
        year: form.year,
        mileage: form.mileage,
        price: form.price,
        currency: form.currency || "INR",
        color: form.color?.trim() || undefined,
        fuelType: form.fuelType || undefined,
        transmission: form.transmission || undefined,
        bodyType: form.bodyType || undefined,
        city: form.city?.trim() || undefined,
        state: form.state?.trim() || undefined,
        country: form.country?.trim() || undefined,
        externalUrl: form.externalUrl?.trim() || undefined,
        ownership: form.ownership?.trim() || undefined,
        isAvailable: form.isAvailable ?? true,
        images: imageUrls.length > 0 ? imageUrls : undefined,
      })
      setForm(initialForm)
      setSelectedImages([])
      setImagePreviews([])
      setShowForm(false)
      await loadListings()
    } catch (err) {
      console.error("Error creating listing:", err)
      setFormError((err as any)?.response?.data?.message ?? "Failed to add listing. Please try again.")
    } finally {
      setSubmitting(false)
      setUploadingImages(false)
    }
  }

  const handleApiSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setApiMessage(null)
    const valid = apiSources.filter((s) => s.apiUrl.trim())
    if (valid.length === 0) {
      setApiMessage({ type: "error", text: "Add at least one API URL." })
      return
    }
    try {
      setApiSaving(true)
      await agencyAPI.updateProfile({
        apiSources: valid.map((s, i) => ({
          id: s.id,
          name: s.name.trim() || undefined,
          apiUrl: s.apiUrl.trim(),
          apiKey: s.apiKey.trim() || undefined,
          order: i,
          isActive: true,
        })),
      })
      setApiMessage({
        type: "success",
        text: valid.length === 1
          ? "API source saved. Listings will sync from this URL."
          : `${valid.length} API sources saved. Listings will sync from all URLs.`,
      })
      await loadProfileForApi()
    } catch (err) {
      setApiMessage({ type: "error", text: (err as any)?.response?.data?.message ?? "Failed to save API settings." })
    } finally {
      setApiSaving(false)
    }
  }

  const addApiSource = () => setApiSources((prev) => [...prev, { name: "", apiUrl: "", apiKey: "" }])
  const removeApiSource = (index: number) => setApiSources((prev) => prev.filter((_, i) => i !== index))
  const updateApiSource = (index: number, field: keyof ApiSourceRow, value: string) =>
    setApiSources((prev) => prev.map((s, i) => (i === index ? { ...s, [field]: value } : s)))

  const hasApiSourceConfigured = apiSources.some((s) => s.apiUrl.trim())

  const handleSyncNow = async () => {
    setApiMessage(null)
    try {
      setSyncNowLoading(true)
      const res = await agencyAPI.syncListings()
      setApiMessage({
        type: "success",
        text: res.count > 0 ? `Synced ${res.count} listing(s) from your API.` : "Sync completed. No new listings from your API.",
      })
      await loadListings()
    } catch (err) {
      setApiMessage({ type: "error", text: (err as any)?.response?.data?.message ?? "Sync failed." })
    } finally {
      setSyncNowLoading(false)
    }
  }

  const formatNumber = (num: number) => new Intl.NumberFormat("en-IN").format(num)
  const formatPrice = (price: number, currency: string) =>
    currency === "INR" ? `₹${formatNumber(Math.round(price))}` : `${currency} ${formatNumber(price)}`

  const openEdit = (row: Listing) => {
    setEditingListing(row)
    setEditForm({
      brand: row.brand,
      model: row.model,
      variant: row.variant ?? "",
      year: row.year,
      mileage: row.mileage,
      price: row.price,
      currency: row.currency ?? "INR",
      color: row.color ?? "",
      fuelType: row.fuelType ?? "",
      transmission: row.transmission ?? "",
      bodyType: row.bodyType ?? "",
      city: row.city ?? "",
      state: row.state ?? "",
      country: row.country ?? "India",
      externalUrl: row.externalUrl ?? "",
      ownership: row.ownership ?? "",
      isAvailable: row.isAvailable,
    })
    setEditError(null)
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingListing) return
    setEditError(null)
    try {
      setEditSubmitting(true)
      await agencyAPI.updateListing(editingListing.id, {
        brand: editForm.brand.trim(),
        model: editForm.model.trim(),
        variant: editForm.variant?.trim() || undefined,
        year: editForm.year,
        mileage: editForm.mileage,
        price: editForm.price,
        currency: editForm.currency || "INR",
        color: editForm.color?.trim() || undefined,
        fuelType: editForm.fuelType || undefined,
        transmission: editForm.transmission || undefined,
        bodyType: editForm.bodyType || undefined,
        city: editForm.city?.trim() || undefined,
        state: editForm.state?.trim() || undefined,
        country: editForm.country?.trim() || undefined,
        externalUrl: editForm.externalUrl?.trim() || undefined,
        ownership: editForm.ownership?.trim() || undefined,
        isAvailable: editForm.isAvailable ?? true,
      })
      setEditingListing(null)
      await loadListings()
    } catch (err) {
      setEditError((err as any)?.response?.data?.message ?? "Failed to update listing.")
    } finally {
      setEditSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this listing?")) return
    try {
      setDeletingId(id)
      await agencyAPI.deleteListing(id)
      await loadListings()
    } catch (err) {
      console.error(err)
      alert((err as any)?.response?.data?.message ?? "Failed to delete listing.")
    } finally {
      setDeletingId(null)
    }
  }

  const toggleAvailable = async (row: Listing) => {
    try {
      await agencyAPI.updateListing(row.id, { isAvailable: !row.isAvailable })
      await loadListings()
    } catch (err) {
      console.error(err)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={48} className="animate-spin text-primary" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-800">
        <p className="font-medium">{error}</p>
        <Link href="/auth/login" className="mt-4 inline-block font-semibold text-primary hover:underline">
          Go to sign in
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">

<div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 sm:px-5">
          <Link2 size={20} className="text-primary" />
          <h2 className="text-base font-semibold text-gray-900">API sync</h2>
        </div>
        <div className="p-4 sm:p-5">
          <p className="text-sm text-gray-600 mb-4">
            Add one or more API URLs. Listings from all sources will sync and appear in search.
          </p>
          {apiMessage && (
            <div
              className={`mb-4 p-3 rounded-lg text-sm ${
                apiMessage.type === "success" ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"
              }`}
            >
              {apiMessage.text}
            </div>
          )}
          <form onSubmit={handleApiSave} className="space-y-4 max-w-2xl">
            {apiSources.map((source, index) => (
              <div
                key={source.id ?? index}
                className="rounded-lg border border-gray-200 bg-gray-50/50 p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">
                    Source {index + 1}{source.name.trim() ? ` · ${source.name}` : ""}
                  </span>
                  {apiSources.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeApiSource(index)}
                      className="text-red-600 hover:text-red-700 p-1"
                      aria-label="Remove source"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">API URL *</label>
                  <input
                    type="url"
                    value={source.apiUrl}
                    onChange={(e) => updateApiSource(index, "apiUrl", e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-ring/30 focus:border-ring"
                    placeholder="https://api.example.com/inventory"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">API Key (optional)</label>
                  <input
                    type="password"
                    value={source.apiKey}
                    onChange={(e) => updateApiSource(index, "apiKey", e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-ring/30 focus:border-ring"
                    placeholder="Leave blank to keep existing"
                    autoComplete="off"
                  />
                </div>
              </div>
            ))}
            <div className="flex flex-wrap gap-2 items-center">
              <button
                type="button"
                onClick={addApiSource}
                className="inline-flex items-center gap-2 px-3 py-2 border border-dashed border-gray-300 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                <Plus size={16} />
                Add another API
              </button>
              <button
                type="submit"
                disabled={apiSaving}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground font-medium rounded-lg hover:opacity-90 disabled:opacity-60 transition-colors"
              >
                {apiSaving ? <Loader2 size={18} className="animate-spin" /> : <ExternalLink size={18} />}
                Save API settings
              </button>
              {hasApiSourceConfigured && (
                <button
                  type="button"
                  onClick={handleSyncNow}
                  disabled={syncNowLoading}
                  className="inline-flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-60 transition-colors"
                >
                  {syncNowLoading ? <Loader2 size={18} className="animate-spin" /> : <RefreshCw size={18} />}
                  Sync now
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
      <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Listings</h1>

      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-gray-200 px-4 py-3 sm:px-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <Car className="h-5 w-5 text-primary" />
            <h2 className="text-base font-semibold text-gray-900">Your listings</h2>
            <span className="text-sm text-gray-500">({listings.length})</span>
            <button
              type="button"
              onClick={() => { setShowForm(!showForm); setFormError(null); }}
              className="inline-flex items-center gap-2 px-3 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:opacity-90 transition-colors"
            >
              <Plus size={18} />
              Add manually
            </button>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <div className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm ${whatsappNumber && String(whatsappNumber).trim() ? "bg-green-50 text-green-800" : "bg-gray-100 text-gray-600"}`}>
              <MessageCircle size={16} />
              <span>{whatsappNumber && String(whatsappNumber).trim() ? "WhatsApp enabled for listings" : "WhatsApp not set"}</span>
            </div>
            <Link href="/agency/settings" className="text-sm font-medium text-primary hover:underline">Settings</Link>
          </div>
        </div>
        {showForm && (
        <div className="border-b border-gray-100 p-4 sm:p-5 bg-gray-50/50">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Add a car listing</h2>
          {formError && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-800 text-sm">{formError}</div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Brand *</label>
                <input
                  type="text"
                  value={form.brand}
                  onChange={(e) => setForm((f) => ({ ...f, brand: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-ring/30 focus:border-ring"
                  placeholder="e.g. Maruti"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Model *</label>
                <input
                  type="text"
                  value={form.model}
                  onChange={(e) => setForm((f) => ({ ...f, model: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-ring/30 focus:border-ring"
                  placeholder="e.g. Swift"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Variant</label>
                <input
                  type="text"
                  value={form.variant}
                  onChange={(e) => setForm((f) => ({ ...f, variant: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-ring/30 focus:border-ring"
                  placeholder="e.g. Zxi"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Year *</label>
                <input
                  type="number"
                  min={1900}
                  max={new Date().getFullYear() + 1}
                  value={form.year || ""}
                  onChange={(e) => setForm((f) => ({ ...f, year: parseInt(e.target.value, 10) || 0 }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-ring/30 focus:border-ring"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">KM Driven *</label>
                <input
                  type="number"
                  min={0}
                  value={form.mileage || ""}
                  onChange={(e) => setForm((f) => ({ ...f, mileage: parseInt(e.target.value, 10) || 0 }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-ring/30 focus:border-ring"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Price *</label>
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  value={form.price || ""}
                  onChange={(e) => setForm((f) => ({ ...f, price: parseFloat(e.target.value) || 0 }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-ring/30 focus:border-ring"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                <select
                  value={form.currency}
                  onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-ring/30 focus:border-ring"
                >
                  <option value="INR">INR</option>
                  <option value="USD">USD</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
                <input
                  type="text"
                  value={form.color}
                  onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-ring/30 focus:border-ring"
                  placeholder="e.g. White"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fuel type</label>
                <select
                  value={form.fuelType}
                  onChange={(e) => setForm((f) => ({ ...f, fuelType: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-ring/30 focus:border-ring"
                >
                  <option value="">Select</option>
                  {FUEL_OPTIONS.map((o) => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Transmission</label>
                <select
                  value={form.transmission}
                  onChange={(e) => setForm((f) => ({ ...f, transmission: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-ring/30 focus:border-ring"
                >
                  <option value="">Select</option>
                  {TRANSMISSION_OPTIONS.map((o) => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Body type</label>
                <select
                  value={form.bodyType}
                  onChange={(e) => setForm((f) => ({ ...f, bodyType: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-ring/30 focus:border-ring"
                >
                  <option value="">Select</option>
                  {BODY_OPTIONS.map((o) => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                <input
                  type="text"
                  value={form.city}
                  onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-ring/30 focus:border-ring"
                  placeholder="e.g. Mumbai"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                <input
                  type="text"
                  value={form.state}
                  onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-ring/30 focus:border-ring"
                  placeholder="e.g. Maharashtra"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Listing URL (optional)</label>
                <input
                  type="url"
                  value={form.externalUrl}
                  onChange={(e) => setForm((f) => ({ ...f, externalUrl: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-ring/30 focus:border-ring"
                  placeholder="https://..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ownership</label>
                <input
                  type="text"
                  value={form.ownership}
                  onChange={(e) => setForm((f) => ({ ...f, ownership: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-ring/30 focus:border-ring"
                  placeholder="e.g. First owner"
                />
              </div>
            </div>
            
            <div className="pt-4 border-t border-gray-200">
              <label className="block text-sm font-medium text-gray-700 mb-2">Car Images</label>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary hover:bg-primary/5 transition-colors">
                    <ImageIcon size={20} className="text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">Select Images</span>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageSelect}
                      className="hidden"
                      disabled={uploadingImages || submitting}
                    />
                  </label>
                  <span className="text-xs text-gray-500">Max 10 images, 5MB each</span>
                </div>
                
                {imagePreviews.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {imagePreviews.map((preview, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={preview}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg border border-gray-200"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute top-1 right-1 p-1 bg-red-500 text-primary-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          disabled={uploadingImages || submitting}
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={submitting || uploadingImages}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground font-medium rounded-lg hover:opacity-90 disabled:opacity-60 transition-colors"
              >
                {(submitting || uploadingImages) ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    {uploadingImages ? "Uploading images..." : "Adding listing..."}
                  </>
                ) : (
                  <>
                    <Plus size={18} />
                    Add listing
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false)
                  setFormError(null)
                  setForm(initialForm)
                  setSelectedImages([])
                  setImagePreviews([])
                }}
                className="px-4 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                disabled={submitting || uploadingImages}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
        </div>
        )}
        {listings.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <Car size={48} className="mx-auto mb-3 text-gray-300" />
            <p>No listings yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Image</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Car</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Year</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Mileage</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Price</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Location</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                  {/* <th className="text-left py-3 px-4 font-semibold text-gray-700">Link</th> */}
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Action</th>
                </tr>
              </thead>
              <tbody>
                {listings.map((row) => (
                  <tr key={row.id} className="border-b border-gray-100 hover:bg-gray-50/50">
                    <td className="py-3 px-4">
                      {row.images && Array.isArray(row.images) && row.images.length > 0 ? (
                        <ImageWithFallback src={row.images[0]} alt={`${row.brand} ${row.model}`} />
                      ) : (
                        <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                          <ImageIcon size={24} className="text-gray-400" />
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 font-medium text-gray-900">
                      {row.brand} {row.model}{row.variant ? ` ${row.variant}` : ""}
                    </td>
                    <td className="py-3 px-4 text-gray-600">{row.year}</td>
                    <td className="py-3 px-4 text-gray-600">{formatNumber(row.mileage)} km</td>
                    <td className="py-3 px-4 font-medium text-gray-900">{formatPrice(row.price, row.currency)}</td>
                    <td className="py-3 px-4 text-gray-600">{[row.city, row.state].filter(Boolean).join(", ") || "—"}</td>
                    <td className="py-3 px-4">
                      <button
                        type="button"
                        onClick={() => toggleAvailable(row)}
                        className={`inline-flex px-2 py-1 rounded-full text-xs font-medium cursor-pointer border transition-colors ${row.isAvailable ? "bg-green-100 text-green-800 border-green-200 hover:bg-green-200" : "bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200"}`}
                      >
                        {row.isAvailable ? "Available" : "Unavailable"}
                      </button>
                    </td>
                    {/* <td className="py-3 px-4">
                      {row.externalUrl ? (
                        <a href={row.externalUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">
                          <ExternalLink size={14} /> Visit
                        </a>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td> */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => openEdit(row)}
                          className="p-1.5 rounded-lg text-gray-600 hover:bg-primary/10 hover:text-primary transition-colors"
                          title="Edit"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(row.id)}
                          disabled={deletingId === row.id}
                          className="p-1.5 rounded-lg text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-50"
                          title="Delete"
                        >
                          {deletingId === row.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editingListing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => !editSubmitting && setEditingListing(null)}>
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Edit listing</h2>
              <button type="button" onClick={() => !editSubmitting && setEditingListing(null)} className="p-1 rounded-lg hover:bg-gray-100">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleEditSubmit} className="p-4 space-y-4">
              {editError && <div className="p-3 rounded-lg bg-red-50 text-red-800 text-sm">{editError}</div>}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Brand *</label>
                  <input type="text" value={editForm.brand} onChange={(e) => setEditForm((f) => ({ ...f, brand: e.target.value }))} className="w-full rounded-lg border border-gray-300 px-3 py-2" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Model *</label>
                  <input type="text" value={editForm.model} onChange={(e) => setEditForm((f) => ({ ...f, model: e.target.value }))} className="w-full rounded-lg border border-gray-300 px-3 py-2" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Year *</label>
                  <input type="number" min={1900} max={new Date().getFullYear() + 1} value={editForm.year || ""} onChange={(e) => setEditForm((f) => ({ ...f, year: parseInt(e.target.value, 10) || 0 }))} className="w-full rounded-lg border border-gray-300 px-3 py-2" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">KM Driven</label>
                  <input type="number" min={0} value={editForm.mileage || ""} onChange={(e) => setEditForm((f) => ({ ...f, mileage: parseInt(e.target.value, 10) || 0 }))} className="w-full rounded-lg border border-gray-300 px-3 py-2" placeholder="km" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
                  <input type="number" min={0} value={editForm.price || ""} onChange={(e) => setEditForm((f) => ({ ...f, price: parseFloat(e.target.value) || 0 }))} className="w-full rounded-lg border border-gray-300 px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Listing URL (optional)</label>
                  <input type="url" value={editForm.externalUrl} onChange={(e) => setEditForm((f) => ({ ...f, externalUrl: e.target.value }))} className="w-full rounded-lg border border-gray-300 px-3 py-2" placeholder="https://..." />
                </div>
                <div className="sm:col-span-2 flex items-center gap-2">
                  <input type="checkbox" id="edit-available" checked={editForm.isAvailable ?? true} onChange={(e) => setEditForm((f) => ({ ...f, isAvailable: e.target.checked }))} className="rounded border-gray-300" />
                  <label htmlFor="edit-available" className="text-sm font-medium text-gray-700">Available</label>
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button type="submit" disabled={editSubmitting} className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground font-medium rounded-lg hover:opacity-90 disabled:opacity-60">
                  {editSubmitting ? <Loader2 size={18} className="animate-spin" /> : "Save"}
                </button>
                <button type="button" onClick={() => !editSubmitting && setEditingListing(null)} className="px-4 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50" disabled={editSubmitting}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      
    </div>
  )
}
