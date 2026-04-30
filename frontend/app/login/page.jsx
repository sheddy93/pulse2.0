"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [generalError, setGeneralError] = useState("");

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
    if (generalError) {
      setGeneralError("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setGeneralError("");

    // Basic validation
    const newErrors = {};
    if (!formData.email) {
      newErrors.email = "Email obbligatoria";
    }
    if (!formData.password) {
      newErrors.password = "Password obbligatoria";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      // Call login API - backend returns token in response body
      const response = await api.post("/auth/login/", {
        email: formData.email,
        password: formData.password,
      });

      // Save token to localStorage for API authentication
      // Save to BOTH keys for compatibility with legacy functions
      if (response.token) {
        localStorage.setItem('auth_token', response.token);
        localStorage.setItem('hr_token', response.token); // Legacy compatibility
      }
      
      // Get user data from response
      let user = response.user || response;

      // CRITICAL: If user is missing or has no role, fetch from /auth/me/
      if (!user || !user.role) {
        try {
          user = await api.get('/auth/me/');
        } catch (meError) {
          console.error('Failed to fetch user data:', meError);
          setGeneralError('Errore nel recupero dati utente. Riprova.');
          setLoading(false);
          return;
        }
      }

      // CRITICAL: Save user to localStorage for AuthGuard and getStoredUser()
      if (user) {
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('hr_user', JSON.stringify(user)); // Legacy compatibility
      }

      // Determine redirect based on user role
      const role = user?.role;
      let redirectPath = "/login"; // Default fallback is login, NOT dashboard

      // Role-based redirects - all 10 roles covered
      // FALLBACK IS LOGIN, NOT DASHBOARD
      if (
        role === "super_admin" ||
        role === "platform_owner"
      ) {
        redirectPath = "/dashboard/admin";
      } else if (
        role === "company_owner" ||
        role === "company_admin" ||
        role === "hr_manager" ||
        role === "manager"
      ) {
        redirectPath = "/dashboard/company";
      } else if (
        role === "labor_consultant" ||
        role === "safety_consultant" ||
        role === "external_consultant"
      ) {
        redirectPath = "/dashboard/consultant";
      } else if (role === "employee") {
        redirectPath = "/dashboard/employee";
      } else {
        // Unknown role - throw error instead of silent fallback
        console.error('Unknown user role:', role, user);
        setGeneralError('Ruolo utente non riconosciuto. Contatta il supporto.');
        setLoading(false);
        return;
      }

      // Check for password change requirement
      if (user?.force_password_change) {
        redirectPath = "/settings/security";
      }

      router.push(redirectPath);
    } catch (error) {
      console.error("Login error:", error);

      if (error.response?.data) {
        const errorData = error.response.data;
        if (errorData.fields) {
          setErrors(errorData.fields);
        }
        setGeneralError(
          errorData.message ||
            errorData.detail ||
            errorData.error ||
            "Credenziali non valide. Riprova."
        );
      } else if (error.message) {
        // Handle error messages from backend validation
        const errorMsg = error.message.toLowerCase();
        if (errorMsg.includes("credentials") || errorMsg.includes("credenziali")) {
          setGeneralError("Email o password non corretti");
        } else if (errorMsg.includes("disattivato") || errorMsg.includes("inactive") || errorMsg.includes("disabled")) {
          setGeneralError("Account non attivo");
        } else if (errorMsg.includes("platform") || errorMsg.includes("access")) {
          setGeneralError("La tua azienda non ha accesso alla piattaforma");
        } else {
          setGeneralError(error.message);
        }
      } else {
        setGeneralError("Si e verificato un errore. Riprova piu tardi.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Accedi al tuo account
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Inserisci le tue credenziali per accedere a PulseHR
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* General Error */}
          {generalError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{generalError}</p>
            </div>
          )}

          {/* Email Field */}
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              id="email"
              value={formData.email}
              onChange={(e) => handleChange("email", e.target.value)}
              placeholder="nome@esempio.it"
              className={`mt-1 block w-full rounded-lg border px-3 py-2 text-gray-900 dark:text-white dark:bg-gray-800 ${
                errors.email
                  ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                  : "border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500"
              }`}
              autoComplete="email"
              disabled={loading}
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email}</p>
            )}
          </div>

          {/* Password Field */}
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Password <span className="text-red-500">*</span>
            </label>
            <div className="relative mt-1">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                value={formData.password}
                onChange={(e) => handleChange("password", e.target.value)}
                placeholder="Inserisci la password"
                className={`block w-full rounded-lg border px-3 py-2 pr-10 text-gray-900 dark:text-white dark:bg-gray-800 ${
                  errors.password
                    ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                    : "border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500"
                }`}
                autoComplete="current-password"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                tabIndex={-1}
              >
                {showPassword ? (
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
strokeWidth={2}
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                )}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">{errors.password}</p>
            )}
          </div>

          {/* Remember Me & Forgot Password */}
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Ricordami
              </span>
            </label>
            <Link
              href="/forgot-password"
              className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
            >
              Password dimenticata?
            </Link>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center px-4 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Accesso in corso...
              </>
            ) : (
              <>
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                  />
                </svg>
                Accedi
              </>
            )}
          </button>
        </form>

        {/* Register Links */}
        <div className="w-full mt-8">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200 dark:border-gray-700" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400">
                Non hai un account?
              </span>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <Link
              href="/register/company"
              className="inline-flex items-center justify-center px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Registra Azienda
            </Link>
            <Link
              href="/register/consultant"
              className="inline-flex items-center justify-center px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Registra Consulente
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}