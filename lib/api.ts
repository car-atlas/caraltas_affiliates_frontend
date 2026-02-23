import axios from 'axios'
import { endpoints } from './endpoints'

const getBaseURL = () => {
  const envURL = process.env.NEXT_PUBLIC_API_BASE_URL
  const defaultURL = 'http://localhost:3377'
  return envURL || defaultURL
}

const api = axios.create({
  baseURL: getBaseURL(),
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
})

api.interceptors.request.use(
  (config) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

api.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token')
        localStorage.removeItem('agency_id')
        localStorage.removeItem('agency_name')
        window.location.href = '/auth/login'
      }
    }
    return Promise.reject(error)
  }
)

export interface SignupRequest {
  phone: string
  password: string
}

export interface SignupResponse {
  message: string
  agency: {
    id: string
    phone: string
    phoneVerified: boolean
  }
}

export interface LoginRequest {
  phone: string
  password?: string
  otp?: string
}

export interface LoginResponse {
  accessToken: string
  agency: {
    id: string
    phone?: string
    name: string
    role: string
    approvalStatus: string
    onboardingStatus: string
  }
}

export interface AgencyUserLoginRequest {
  email: string
  password: string
}

export interface AgencyUserLoginResponse {
  accessToken: string
  agency: {
    id: string
    name: string
    role: string
    approvalStatus: string
    onboardingStatus: string
  }
  user: {
    id: string
    email: string
    name: string | null
    role: string
  }
}

export interface VerifyPhoneRequest {
  phone: string
  otp: string
}

export interface VerifyPhoneResponse {
  message: string
  agency: {
    id: string
    phone: string
    phoneVerified: boolean
  }
}

export interface RequestLoginOtpRequest {
  phone: string
}

export interface RequestLoginOtpResponse {
  message: string
}

export interface ForgotPasswordRequest {
  phone: string
}

export interface ForgotPasswordResponse {
  message: string
}

export interface ResetPasswordRequest {
  phone: string
  otp: string
  password: string
}

export interface ResetPasswordResponse {
  message: string
}

export interface OnboardingStatusResponse {
  id: string
  name: string
  gstNumber: string | null
  onboardingStatus: string
  approvalStatus: string
  businessType: string | null
  panNumber: string | null
  registrationNumber: string | null
  yearOfEstablishment: number | null
  contactPersonName: string | null
  contactPhone: string | null
  contactEmail: string | null
  whatsappNumber: string | null
  websiteUrl: string | null
  addressLine1: string | null
  addressLine2: string | null
  city: string | null
  state: string | null
  pincode: string | null
  country: string | null
  serviceAreas: string[] | null
  bankName: string | null
  accountNumber: string | null
  ifscCode: string | null
  accountHolderName: string | null
  apiUrl: string | null
  apiKey: string | null
  integrationType: string
  apifyActorId: string | null
  apiSources?: AgencyApiSource[]
}

export interface AgencyApiSource {
  id: string
  name: string | null
  apiUrl: string
  apiKey: string | null
  order: number
  isActive: boolean
}

export interface ResendVerifyPhoneOtpRequest {
  phone: string
}

export interface ResendVerifyPhoneOtpResponse {
  message: string
}

export interface OnboardingStep1Request {
  name: string
  businessType?: string
  gstNumber: string
  panNumber?: string
  registrationNumber?: string
  yearOfEstablishment?: number
}

export interface OnboardingStep2Request {
  contactPersonName?: string
  contactPhone?: string
  contactEmail: string
  whatsappNumber?: string
  websiteUrl?: string
}

export interface OnboardingStep3Request {
  addressLine1?: string
  addressLine2?: string
  city?: string
  state?: string
  pincode?: string
  country?: string
  serviceAreas?: string[]
}

export interface OnboardingStep4Request {
  bankName: string
  accountNumber: string
  ifscCode: string
  accountHolderName: string
}

export interface OnboardingStep5Request {
  apiUrl?: string
  apiKey?: string
}

export interface Listing {
  id: string
  agencyId: string
  brand: string
  model: string
  variant: string | null
  year: number
  mileage: number
  price: number
  currency: string
  color: string | null
  fuelType: string | null
  transmission: string | null
  bodyType: string | null
  city: string | null
  state: string | null
  country: string | null
  isAvailable: boolean
  externalUrl: string | null
  ownership: string | null
  images: string[] | null
  imageSource: string | null
  createdAt: string
  updatedAt: string
}

export interface CreateListingRequest {
  brand: string
  model: string
  variant?: string
  year: number
  mileage: number
  price: number
  currency?: string
  color?: string
  fuelType?: string
  transmission?: string
  bodyType?: string
  city?: string
  state?: string
  country?: string
  externalUrl?: string
  ownership?: string
  isAvailable?: boolean
  images?: string[]
}

export const authAPI = {
  signup: async (data: SignupRequest): Promise<SignupResponse> => {
    const response = await api.post(endpoints.auth.signup, data)
    return response.data
  },

  login: async (data: LoginRequest): Promise<LoginResponse> => {
    const response = await api.post(endpoints.auth.login, data)
    const data_ = response.data as LoginResponse
    if (data_.accessToken && typeof window !== 'undefined') {
      localStorage.setItem('auth_token', data_.accessToken)
      if (data_.agency?.id) localStorage.setItem('agency_id', data_.agency.id)
      if (data_.agency?.name) localStorage.setItem('agency_name', data_.agency.name)
    }
    return data_
  },

  agencyUserLogin: async (data: AgencyUserLoginRequest): Promise<AgencyUserLoginResponse> => {
    const response = await api.post(endpoints.auth.agencyUserLogin, data)
    const data_ = response.data as AgencyUserLoginResponse
    if (data_.accessToken && typeof window !== 'undefined') {
      localStorage.setItem('auth_token', data_.accessToken)
      if (data_.agency?.id) localStorage.setItem('agency_id', data_.agency.id)
      if (data_.agency?.name) localStorage.setItem('agency_name', data_.agency.name)
    }
    return data_
  },

  requestLoginOtp: async (data: RequestLoginOtpRequest): Promise<RequestLoginOtpResponse> => {
    const response = await api.post(endpoints.auth.requestLoginOtp, data)
    return response.data
  },

  verifyPhone: async (data: VerifyPhoneRequest): Promise<VerifyPhoneResponse> => {
    const response = await api.post(endpoints.auth.verifyPhone, data)
    return response.data
  },

  forgotPassword: async (data: ForgotPasswordRequest): Promise<ForgotPasswordResponse> => {
    const response = await api.post(endpoints.auth.forgotPassword, data)
    return response.data
  },

  resetPassword: async (data: ResetPasswordRequest): Promise<ResetPasswordResponse> => {
    const response = await api.post(endpoints.auth.resetPassword, data)
    return response.data
  },

  getOnboardingStatus: async (): Promise<OnboardingStatusResponse> => {
    const response = await api.get(endpoints.onboarding.status)
    const data = response.data
    if (data.serviceAreas && typeof data.serviceAreas === 'string') {
      try {
        data.serviceAreas = JSON.parse(data.serviceAreas)
      } catch {
        data.serviceAreas = []
      }
    }
    return data
  },
  resendVerifyPhoneOtp: async (data: ResendVerifyPhoneOtpRequest): Promise<ResendVerifyPhoneOtpResponse> => {
    const response = await api.post(endpoints.auth.resendVerifyPhoneOtp, data)
    return response.data
  },

  updateOnboardingStep1: async (data: OnboardingStep1Request) => {
    const response = await api.put(endpoints.onboarding.step1, data)
    return response.data
  },

  updateOnboardingStep2: async (data: OnboardingStep2Request) => {
    const response = await api.put(endpoints.onboarding.step2, data)
    return response.data
  },

  updateOnboardingStep3: async (data: OnboardingStep3Request) => {
    const response = await api.put(endpoints.onboarding.step3, data)
    return response.data
  },

  updateOnboardingStep4: async (data: OnboardingStep4Request) => {
    const response = await api.put(endpoints.onboarding.step4, data)
    return response.data
  },

  updateOnboardingStep5: async (data: OnboardingStep5Request) => {
    const response = await api.put(endpoints.onboarding.step5, data)
    return response.data
  },

  submitOnboarding: async () => {
    const response = await api.post(endpoints.onboarding.submit)
    return response.data
  },

  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token')
      localStorage.removeItem('agency_id')
      localStorage.removeItem('agency_name')
    }
  },
}

export interface AgencyUser {
  id: string
  email: string
  name: string | null
  role: string
  createdAt: string
}

export interface CreateAgencyUserRequest {
  email: string
  password: string
  name?: string
  role?: 'DEALER_ADMIN' | 'DEALER_USER'
}

export interface UpdateAgencyUserRequest {
  name?: string
  role?: 'DEALER_ADMIN' | 'DEALER_USER'
}

export interface AgencyProfile {
  id: string
  email: string
  name: string
  businessType: string | null
  gstNumber: string | null
  panNumber: string | null
  registrationNumber: string | null
  yearOfEstablishment: number | null
  contactPersonName: string | null
  contactPhone: string | null
  contactEmail: string | null
  whatsappNumber: string | null
  websiteUrl: string | null
  addressLine1: string | null
  addressLine2: string | null
  city: string | null
  state: string | null
  pincode: string | null
  country: string | null
  serviceAreas: string[] | null
  bankName: string | null
  accountNumber: string | null
  ifscCode: string | null
  accountHolderName: string | null
  apiUrl: string | null
  apiKey: string | null
  integrationType: string
  cpc: number | null
  isActive: boolean
  onboardingStatus: string
  approvalStatus: string
  role?: string
  activeListings: number
  createdAt: string
  apiSources?: AgencyApiSource[]
}

export interface UpdateProfileRequest {
  name?: string
  businessType?: string
  panNumber?: string
  registrationNumber?: string
  yearOfEstablishment?: number
  contactPersonName?: string
  contactPhone?: string
  contactEmail?: string
  whatsappNumber?: string
  websiteUrl?: string
  addressLine1?: string
  addressLine2?: string
  city?: string
  state?: string
  pincode?: string
  country?: string
  serviceAreas?: string[]
  bankName?: string
  accountNumber?: string
  ifscCode?: string
  accountHolderName?: string
  apiUrl?: string
  apiKey?: string
  apiSources?: Array<{
    id?: string
    name?: string
    apiUrl: string
    apiKey?: string
    order?: number
    isActive?: boolean
  }>
}

export interface ResendVerifyPhoneOtpRequest {
  phone: string
}

export interface ResendVerifyPhoneOtpResponse {
  message: string
}

export interface DashboardSummary {
  activeListings: number
  totalClicks: number
  totalBill: number
  cpc: number
  totalLeads: number
  cpl: number
  configuredCpl?: number
  todayLeads: number
  weekLeads: number
  monthLeads: number
  todayClicks: number
  yesterdayClicks: number
  weekClicks: number
  lastWeekClicks: number
  monthClicks: number
  lastMonthClicks: number
  monthBill: number
  lastMonthBill: number
  recentClicks: Array<{
    id: string
    listingId: string | null
    listing: {
      id: string
      brand: string
      model: string
      year: number
    } | null
    createdAt: string
  }>
  topListings: Array<{
    id: string
    brand: string
    model: string
    year: number
    clicks: number
  }>
}

export interface ClickStats {
  totalClicks: number
  totalCost: number
  cpc: number
  totalLeads: number
  cpl: number
  clicksByListing: Array<{
    listingId: string | null
    _count: { id: number }
  }>
  clicksByDate: Record<string, number>
  leadsByListing?: Array<{
    listingId: string | null
    _count: { id: number }
  }>
  leadsByDate?: Record<string, number>
}

export const agencyAPI = {
  getProfile: async (): Promise<AgencyProfile> => {
    const response = await api.get(endpoints.agency.profile)
    return response.data
  },

  updateProfile: async (data: UpdateProfileRequest) => {
    const response = await api.put(endpoints.agency.profile, data)
    return response.data
  },

  /** Trigger sync of this agency's API listings now (only this agency's data). */
  syncListings: async (): Promise<{ message: string; count: number }> => {
    const response = await api.post(endpoints.agency.sync)
    return response.data
  },

  getListings: async (): Promise<Listing[]> => {
    const response = await api.get(endpoints.agency.listings)
    return response.data
  },

  createListing: async (data: CreateListingRequest): Promise<Listing> => {
    const response = await api.post(endpoints.agency.listings, data)
    return response.data
  },

  updateListing: async (id: string, data: Partial<CreateListingRequest>): Promise<Listing> => {
    const response = await api.patch(`${endpoints.agency.listings}/${id}`, data)
    return response.data
  },

  deleteListing: async (id: string): Promise<{ message: string }> => {
    const response = await api.delete(`${endpoints.agency.listings}/${id}`)
    return response.data
  },

  uploadImages: async (files: File[]): Promise<{ images: string[] }> => {
    const formData = new FormData()
    files.forEach((file) => {
      formData.append('images', file)
    })
    const response = await api.post(endpoints.agency.uploadImages, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },

  getDashboardSummary: async (agencyId: string): Promise<DashboardSummary> => {
    const response = await api.get(endpoints.clicks.dashboardSummary(agencyId))
    return response.data
  },

  getClickStats: async (
    agencyId: string,
    startDate?: string,
    endDate?: string,
  ): Promise<ClickStats> => {
    const params = new URLSearchParams()
    if (startDate) params.append('startDate', startDate)
    if (endDate) params.append('endDate', endDate)
    const queryString = params.toString()
    const url = `${endpoints.clicks.stats(agencyId)}${queryString ? `?${queryString}` : ''}`
    const response = await api.get(url)
    return response.data
  },

  markAsLead: async (clickId: string): Promise<{ id: string; converted: boolean }> => {
    const response = await api.post(endpoints.clicks.lead, { clickId })
    return response.data
  },

  getUsers: async (): Promise<AgencyUser[]> => {
    const response = await api.get(endpoints.agency.users)
    return response.data
  },

  createUser: async (data: CreateAgencyUserRequest): Promise<AgencyUser> => {
    const response = await api.post(endpoints.agency.users, data)
    return response.data
  },

  updateUser: async (id: string, data: UpdateAgencyUserRequest): Promise<AgencyUser> => {
    const response = await api.patch(`${endpoints.agency.users}/${id}`, data)
    return response.data
  },

  deleteUser: async (id: string): Promise<{ message: string }> => {
    const response = await api.delete(`${endpoints.agency.users}/${id}`)
    return response.data
  },
}

export default api
