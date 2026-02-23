export const endpoints = {
  auth: {
    signup: '/auth/signup',
    login: '/auth/login',
    agencyUserLogin: '/auth/agency-user/login',
    requestLoginOtp: '/auth/request-login-otp',
    verifyPhone: '/auth/verify-phone',
    forgotPassword: '/auth/forgot-password',
    resetPassword: '/auth/reset-password',
    resendVerifyPhoneOtp: '/auth/resend-verify-phone-otp',
  },
  onboarding: {
    status: '/onboarding',
    step1: '/onboarding/step/1',
    step2: '/onboarding/step/2',
    step3: '/onboarding/step/3',
    step4: '/onboarding/step/4',
    step5: '/onboarding/step/5',
    submit: '/onboarding/submit',
  },
  agency: {
    profile: '/agency/profile',
    listings: '/agency/listings',
    uploadImages: '/agency/listings/upload-images',
    users: '/agency/users',
    sync: '/agency/sync',
  },
  clicks: {
    stats: (agencyId: string) => `/click/stats/${agencyId}`,
    dashboardSummary: (agencyId: string) => `/click/dashboard-summary/${agencyId}`,
    lead: '/click/lead',
  },
}

export default endpoints
