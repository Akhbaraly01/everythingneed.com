// Public API for the "authentication" module.
// Other modules MUST import only from "@modules/authentication", never reach into
// subfolders. This is the seam that lets us physically relocate files later
// (and ultimately migrate to a Laravel Modules/Authentication package)
// without breaking consumers.

export { AuthProvider, useAuth } from "@/contexts/AuthContext";
export { default as AuthPage } from "@/pages/Auth";
export { default as OTPVerification } from "@/components/auth/OTPVerification";
export { default as TwoFactorSetup } from "@/components/auth/TwoFactorSetup";
