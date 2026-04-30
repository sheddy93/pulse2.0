"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import {
  AuthLayout,
  AuthCard,
  AuthCardHeader,
  AuthCardTitle,
  AuthCardDescription,
  AuthCardContent,
  AuthCardFooter,
  AuthHeader,
  AuthFooter
} from "@/components/auth";
import {
  StepIndicator,
  FormField,
  TextInput,
  PasswordInput,
  SelectInput,
  Checkbox,
  validateRequired,
  validateEmail,
  validatePassword,
  validatePasswordMatch,
  validatePhone,
  validateURL
} from "@/components/forms";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  CheckCircle2,
  ArrowLeft,
  ArrowRight,
  User,
  Briefcase,
  ShieldCheck,
  AlertCircle
} from "lucide-react";
import Link from "next/link";

// Step configuration
const STEPS = [
  {
    label: "Account",
    description: "Credenziali",
    icon: ShieldCheck
  },
  {
    label: "Personali",
    description: "Dati personali",
    icon: User
  },
  {
    label: "Professionali",
    description: "Esperienza",
    icon: Briefcase
  },
];

// Specialization options - mapped to backend role values
const SPECIALIZATIONS = [
  { value: "labor_consultant", label: "Consulente del Lavoro" },
  { value: "safety_consultant", label: "Consulente Sicurezza sul Lavoro" },
];

// Experience options
const EXPERIENCE_YEARS = [
  { value: "0-2", label: "0-2 anni" },
  { value: "3-5", label: "3-5 anni" },
  { value: "6-10", label: "6-10 anni" },
  { value: "10+", label: "Più di 10 anni" },
];

export default function ConsultantRegisterPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [globalError, setGlobalError] = useState("");

  // Form data state
  const [formData, setFormData] = useState({
    // Step 1: Account Info
    email: "",
    password: "",
    confirmPassword: "",
    acceptTerms: false,

    // Step 2: Personal Info
    firstName: "",
    lastName: "",
    phoneNumber: "",
    fiscalCode: "",

    // Step 3: Professional Info
    specialization: "",
    yearsOfExperience: "",
    companyName: "",
    linkedinUrl: "",
  });

  // Form errors state
  const [errors, setErrors] = useState({});

  // Update form data
  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
    // Clear global error
    if (globalError) setGlobalError("");
  };

  // Calculate password strength
  const getPasswordStrength = () => {
    const password = formData.password;
    if (!password) return { score: 0, label: "", color: "bg-gray-200" };

    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    const levels = [
      { score: 0, label: "", color: "bg-gray-200" },
      { score: 1, label: "Debole", color: "bg-red-500" },
      { score: 2, label: "Accettabile", color: "bg-yellow-500" },
      { score: 3, label: "Buona", color: "bg-blue-500" },
      { score: 4, label: "Forte", color: "bg-green-500" },
      { score: 5, label: "Molto forte", color: "bg-emerald-500" },
    ];

    return levels[score];
  };

  // Validate Step 1: Account Info
  const validateStep1 = () => {
    const newErrors = {};

    const emailError = validateEmail(formData.email);
    if (emailError) newErrors.email = emailError;

    const passwordError = validatePassword(formData.password);
    if (passwordError) newErrors.password = passwordError;

    const confirmPasswordError = validatePasswordMatch(formData.password, formData.confirmPassword);
    if (confirmPasswordError) newErrors.confirmPassword = confirmPasswordError;

    if (!formData.acceptTerms) {
      newErrors.acceptTerms = "Devi accettare i termini e condizioni";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Validate Step 2: Personal Info
  const validateStep2 = () => {
    const newErrors = {};

    const firstNameError = validateRequired(formData.firstName);
    if (firstNameError) newErrors.firstName = firstNameError;

    const lastNameError = validateRequired(formData.lastName);
    if (lastNameError) newErrors.lastName = lastNameError;

    const phoneError = validatePhone(formData.phoneNumber);
    if (phoneError) newErrors.phoneNumber = phoneError;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Validate Step 3: Professional Info
  const validateStep3 = () => {
    const newErrors = {};

    const specializationError = validateRequired(formData.specialization);
    if (specializationError) newErrors.specialization = specializationError;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle next step
  const handleNext = () => {
    let isValid = false;

    switch (currentStep) {
      case 0:
        isValid = validateStep1();
        break;
      case 1:
        isValid = validateStep2();
        break;
      case 2:
        isValid = validateStep3();
        break;
      default:
        isValid = true;
    }

    if (isValid && currentStep < STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (isValid && currentStep === STEPS.length - 1) {
      handleSubmit();
    }
  };

  // Handle previous step
  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
      setErrors({});
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Handle form submission
  const handleSubmit = async () => {
    setIsLoading(true);
    setGlobalError("");

    try {
      const flatPayload = {
        email: formData.email,
        password: formData.password,
        password_confirm: formData.confirmPassword,
        first_name: formData.firstName,
        last_name: formData.lastName,
        role: formData.specialization,
        studio_name: formData.companyName || "",
        phone: formData.phoneNumber || "",
        fiscal_code: formData.fiscalCode || "",
      };

      const data = await api.post('/public/consultant-registration/', flatPayload);

      // Success
      setIsSuccess(true);

      // Redirect after 2 seconds
      setTimeout(() => {
        router.push("/login?registered=true");
      }, 2000);

    } catch (error) {
      if (error.fields) {
        setErrors(error.fields);
        setGlobalError(Object.values(error.fields).flat().join(", "));
      } else {
        setGlobalError(error.message || "Si è verificato un errore. Riprova più tardi.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Render success screen
  if (isSuccess) {
    return (
      <AuthLayout>
        <AuthHeader />
        <div className="flex items-center justify-center min-h-[60vh]">
          <AuthCard className="max-w-md">
            <AuthCardContent className="text-center py-12">
              <div className="mb-6 flex justify-center">
                <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <CheckCircle2 className="w-12 h-12 text-green-600 dark:text-green-400" />
                </div>
              </div>

              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">
                Registrazione Completata!
              </h2>

              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Il tuo account consulente è stato creato con successo. Verrai reindirizzato alla pagina di login.
              </p>

              <div className="flex justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
              </div>
            </AuthCardContent>
          </AuthCard>
        </div>
        <AuthFooter />
      </AuthLayout>
    );
  }

  const passwordStrength = getPasswordStrength();

  return (
    <AuthLayout>
      <AuthHeader />

      <AuthCard className="max-w-3xl mx-auto">
        <AuthCardHeader>
          <AuthCardTitle>Registrazione Consulente</AuthCardTitle>
          <AuthCardDescription>
            Crea il tuo account professionale PulseHR in pochi semplici passaggi
          </AuthCardDescription>
        </AuthCardHeader>

        <AuthCardContent>
          {/* Step Indicator */}
          <div className="mb-8">
            <StepIndicator
              steps={STEPS}
              currentStep={currentStep}
            />
          </div>

          {/* Global Error Message */}
          {globalError && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800 dark:text-red-200">{globalError}</p>
            </div>
          )}

          {/* Step 1: Account Info */}
          {currentStep === 0 && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center space-x-3 pb-4 border-b border-gray-200 dark:border-gray-700">
                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    Informazioni Account
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Crea le tue credenziali di accesso
                  </p>
                </div>
              </div>

              <FormField
                label="Indirizzo Email"
                required
                error={errors.email}
              >
                <TextInput
                  type="email"
                  placeholder="nome.cognome@esempio.it"
                  value={formData.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  error={!!errors.email}
                  autoComplete="email"
                />
              </FormField>

              <FormField
                label="Password"
                required
                error={errors.password}
                hint="Minimo 8 caratteri, con maiuscole, minuscole e numeri"
              >
                <div className="space-y-2">
                  <PasswordInput
                    placeholder="Crea una password sicura"
                    value={formData.password}
                    onChange={(e) => handleChange("password", e.target.value)}
                    error={!!errors.password}
                    autoComplete="new-password"
                  />
                  {formData.password && (
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all ${passwordStrength.color}`}
                            style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500">{passwordStrength.label}</span>
                      </div>
                    </div>
                  )}
                </div>
              </FormField>

              <FormField
                label="Conferma Password"
                required
                error={errors.confirmPassword}
              >
                <PasswordInput
                  placeholder="Ripeti la password"
                  value={formData.confirmPassword}
                  onChange={(e) => handleChange("confirmPassword", e.target.value)}
                  error={!!errors.confirmPassword}
                  autoComplete="new-password"
                />
              </FormField>

              <FormField error={errors.acceptTerms}>
                <Checkbox
                  checked={formData.acceptTerms}
                  onChange={(checked) => handleChange("acceptTerms", checked)}
                  label={
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      Accetto i{" "}
                      <Link href="/terms" className="text-blue-600 hover:underline dark:text-blue-400">
                        Termini e Condizioni
                      </Link>{" "}
                      e la{" "}
                      <Link href="/privacy" className="text-blue-600 hover:underline dark:text-blue-400">
                        Privacy Policy
                      </Link>
                    </span>
                  }
                />
              </FormField>
            </div>
          )}

          {/* Step 2: Personal Info */}
          {currentStep === 1 && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center space-x-3 pb-4 border-b border-gray-200 dark:border-gray-700">
                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    Dati Personali
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Completa il tuo profilo personale
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  label="Nome"
                  required
                  error={errors.firstName}
                >
                  <TextInput
                    placeholder="Mario"
                    value={formData.firstName}
                    onChange={(e) => handleChange("firstName", e.target.value)}
                    error={!!errors.firstName}
                    autoComplete="given-name"
                  />
                </FormField>

                <FormField
                  label="Cognome"
                  required
                  error={errors.lastName}
                >
                  <TextInput
                    placeholder="Rossi"
                    value={formData.lastName}
                    onChange={(e) => handleChange("lastName", e.target.value)}
                    error={!!errors.lastName}
                    autoComplete="family-name"
                  />
                </FormField>
              </div>

              <FormField
                label="Numero di Telefono"
                error={errors.phoneNumber}
                hint="Formato: +39 xxx xxxxxxx o 3xx xxxxxxx"
              >
                <TextInput
                  type="tel"
                  placeholder="+39 333 1234567"
                  value={formData.phoneNumber}
                  onChange={(e) => handleChange("phoneNumber", e.target.value)}
                  error={!!errors.phoneNumber}
                  autoComplete="tel"
                />
              </FormField>

              <FormField
                label="Codice Fiscale"
                error={errors.fiscalCode}
                hint="Opzionale - 16 caratteri alfanumerici"
              >
                <TextInput
                  placeholder="RSSMRA80A01H501U"
                  value={formData.fiscalCode}
                  onChange={(e) => handleChange("fiscalCode", e.target.value.toUpperCase())}
                  error={!!errors.fiscalCode}
                  maxLength={16}
                />
              </FormField>
            </div>
          )}

          {/* Step 3: Professional Info */}
          {currentStep === 2 && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center space-x-3 pb-4 border-b border-gray-200 dark:border-gray-700">
                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <Briefcase className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    Informazioni Professionali
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Seleziona la tua specializzazione
                  </p>
                </div>
              </div>

              <FormField
                label="Tipo di Consulente"
                required
                error={errors.specialization}
              >
                <SelectInput
                  placeholder="Seleziona il tipo di consulente"
                  value={formData.specialization}
                  onChange={(e) => handleChange("specialization", e.target.value)}
                  error={!!errors.specialization}
                  options={SPECIALIZATIONS}
                />
              </FormField>

              <FormField
                label="Nome Studio (opzionale)"
                error={errors.companyName}
              >
                <TextInput
                  placeholder="Studio Bianchi & Partners"
                  value={formData.companyName}
                  onChange={(e) => handleChange("companyName", e.target.value)}
                  error={!!errors.companyName}
                  autoComplete="organization"
                />
              </FormField>

              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  <strong>Nota:</strong> Dopo la registrazione, potrai completare il tuo profilo professionale con ulteriori dettagli come anni di esperienza e azienda.
                </p>
              </div>
            </div>
          )}
        </AuthCardContent>

        <AuthCardFooter>
          <div className="flex items-center justify-between w-full">
            {/* Back Button */}
            <Button
              type="button"
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 0 || isLoading}
              className="min-w-[120px]"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Indietro
            </Button>

            {/* Next/Submit Button */}
            <Button
              type="button"
              onClick={handleNext}
              disabled={isLoading}
              className="min-w-[120px]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Attendere...
                </>
              ) : currentStep === STEPS.length - 1 ? (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Completa
                </>
              ) : (
                <>
                  Avanti
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </div>

          {/* Login Link */}
          <div className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700 pt-6">
            Hai già un account?{" "}
            <Link
              href="/login"
              className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
            >
              Accedi qui
            </Link>
          </div>
        </AuthCardFooter>
      </AuthCard>

      <AuthFooter />
    </AuthLayout>
  );
}