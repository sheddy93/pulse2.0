"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
  AuthFooter,
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
  validateVAT,
  validateURL,
} from "@/components/forms";
import {
  ShieldCheck,
  Building2,
  MapPin,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Loader2,
  AlertCircle,
  Check,
} from "lucide-react";

// Step configuration
const STEPS = [
  {
    label: "Account",
    icon: ShieldCheck,
    description: "Amministratore",
  },
  {
    label: "Azienda",
    icon: Building2,
    description: "Dati azienda",
  },
  {
    label: "Sede",
    icon: MapPin,
    description: "Indirizzo",
  },
  {
    label: "Conferma",
    icon: CheckCircle2,
    description: "Verifica",
  },
];

// Italian provinces
const ITALIAN_PROVINCES = [
  "AG", "AL", "AN", "AO", "AP", "AQ", "AR", "AT", "AV", "BA",
  "BT", "BG", "BI", "BL", "BN", "BO", "BR", "BS", "BZ", "CA",
  "CB", "CE", "CH", "CI", "CL", "CN", "CO", "CR", "CS", "CT",
  "CZ", "EN", "FC", "FE", "FG", "FI", "FM", "FR", "GE", "GO",
  "GR", "IM", "IS", "KR", "LC", "LE", "LI", "LO", "LT", "LU",
  "MB", "MC", "ME", "MI", "MN", "MO", "MS", "MT", "NA", "NO",
  "NU", "OG", "OR", "OT", "PA", "PC", "PD", "PE", "PG", "PI",
  "PN", "PO", "PR", "PT", "PU", "PV", "PZ", "RA", "RC", "RE",
  "RG", "RI", "RN", "RO", "RM", "SA", "SI", "SO", "SP", "SR",
  "SS", "SV", "TA", "TE", "TN", "TO", "TP", "TR", "TS", "TV",
  "UD", "VA", "VB", "VC", "VE", "VI", "VR", "VT", "VV", "XX",
].map(code => ({ value: code, label: code }));

// Industry sectors
const INDUSTRIES = [
  { value: "technology", label: "Tecnologia" },
  { value: "healthcare", label: "Sanita" },
  { value: "finance", label: "Finanza" },
  { value: "retail", label: "Retail" },
  { value: "manufacturing", label: "Manifattura" },
  { value: "services", label: "Servizi" },
  { value: "other", label: "Altro" },
];

// Company sizes
const COMPANY_SIZES = [
  { value: "1-10", label: "1-10 dipendenti" },
  { value: "11-50", label: "11-50 dipendenti" },
  { value: "51-200", label: "51-200 dipendenti" },
  { value: "201-500", label: "201-500 dipendenti" },
  { value: "500+", label: "500+ dipendenti" },
];

export default function CompanyRegistrationPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Step 1: Account Admin
  const [adminData, setAdminData] = useState({
    email: "",
    firstName: "",
    lastName: "",
    password: "",
    confirmPassword: "",
  });
  const [adminErrors, setAdminErrors] = useState({});

  // Step 2: Company Info
  const [companyData, setCompanyData] = useState({
    name: "",
    vat: "",
    sector: "",
    size: "",
    website: "",
  });
  const [companyErrors, setCompanyErrors] = useState({});

  // Step 3: Company Address
  const [addressData, setAddressData] = useState({
    street: "",
    city: "",
    province: "",
    postalCode: "",
    country: "IT",
  });
  const [addressErrors, setAddressErrors] = useState({});

  // Step 4: Confirmation
  const [agreementData, setAgreementData] = useState({
    terms: false,
    privacy: false,
    marketing: false,
  });
  const [agreementErrors, setAgreementErrors] = useState({});

  // Calculate password strength
  const getPasswordStrength = () => {
    const password = adminData.password;
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

  // Validate Step 1: Admin Account
  const validateStep1 = () => {
    const errors = {};

    const emailError = validateEmail(adminData.email);
    if (emailError) errors.email = emailError;

    const firstNameError = validateRequired(adminData.firstName);
    if (firstNameError) errors.firstName = firstNameError;

    const lastNameError = validateRequired(adminData.lastName);
    if (lastNameError) errors.lastName = lastNameError;

    const passwordError = validatePassword(adminData.password);
    if (passwordError) errors.password = passwordError;

    const confirmPasswordError = validatePasswordMatch(
      adminData.password,
      adminData.confirmPassword
    );
    if (confirmPasswordError) errors.confirmPassword = confirmPasswordError;

    setAdminErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Validate Step 2: Company Info
  const validateStep2 = () => {
    const errors = {};

    const nameError = validateRequired(companyData.name);
    if (nameError) errors.name = nameError;

    const vatError = validateVAT(companyData.vat);
    if (vatError) errors.vat = vatError;

    const sectorError = validateRequired(companyData.sector);
    if (sectorError) errors.sector = sectorError;

    const sizeError = validateRequired(companyData.size);
    if (sizeError) errors.size = sizeError;

    if (companyData.website) {
      const websiteError = validateURL(companyData.website);
      if (websiteError) errors.website = websiteError;
    }

    setCompanyErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Validate Step 3: Address
  const validateStep3 = () => {
    const errors = {};

    const streetError = validateRequired(addressData.street);
    if (streetError) errors.street = streetError;

    const cityError = validateRequired(addressData.city);
    if (cityError) errors.city = cityError;

    const provinceError = validateRequired(addressData.province);
    if (provinceError) errors.province = provinceError;

    const postalCodeError = validateRequired(addressData.postalCode);
    if (postalCodeError) {
      errors.postalCode = postalCodeError;
    } else if (!/^\d{5}$/.test(addressData.postalCode)) {
      errors.postalCode = "Il CAP deve contenere 5 cifre";
    }

    setAddressErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Validate Step 4: Agreements
  const validateStep4 = () => {
    const errors = {};

    if (!agreementData.terms) {
      errors.terms = "Devi accettare i termini e condizioni";
    }

    if (!agreementData.privacy) {
      errors.privacy = "Devi accettare l'informativa sulla privacy";
    }

    setAgreementErrors(errors);
    return Object.keys(errors).length === 0;
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
      case 3:
        isValid = validateStep4();
        break;
      default:
        isValid = true;
    }

    if (isValid && currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
      setSubmitError("");
    } else if (isValid && currentStep === STEPS.length - 1) {
      handleSubmit();
    }
  };

  // Handle previous step
  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      setSubmitError("");
    }
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateStep4()) return;

    setIsLoading(true);
    setSubmitError("");

    try {
      // Payload structure as specified
      const flatPayload = {
        admin_first_name: adminData.firstName,
        admin_last_name: adminData.lastName,
        admin_email: adminData.email,
        password: adminData.password,
        password_confirm: adminData.confirmPassword,
        company_name: companyData.name,
        legal_name: companyData.name,
        vat_number: companyData.vat,
        contact_email: adminData.email,
        contact_phone: "",
        country_code: "IT",
        city: addressData.city,
        state_region: addressData.province,
        postal_code: addressData.postalCode,
        address_line_1: addressData.street,
      };

      const data = await api.post('/public/company-registration/', flatPayload);

      setSuccessMessage("Registrazione completata con successo!");

      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push("/login?registered=true");
      }, 2000);
    } catch (error) {
      console.error("Registration error:", error);
      if (error.fields) {
        setSubmitError(Object.values(error.fields).flat().join(", "));
      } else {
        setSubmitError(error.message || "Si è verificato un errore. Riprova più tardi.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const passwordStrength = getPasswordStrength();

  // Render Step 1: Admin Account
  const renderStep1 = () => (
    <div className="space-y-5">
      <FormField
        label="Email Amministratore"
        required
        error={adminErrors.email}
      >
        <TextInput
          type="email"
          value={adminData.email}
          onChange={(e) =>
            setAdminData({ ...adminData, email: e.target.value })
          }
          placeholder="admin@azienda.it"
          error={!!adminErrors.email}
          autoComplete="email"
        />
      </FormField>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <FormField label="Nome" required error={adminErrors.firstName}>
          <TextInput
            value={adminData.firstName}
            onChange={(e) =>
              setAdminData({ ...adminData, firstName: e.target.value })
            }
            placeholder="Mario"
            error={!!adminErrors.firstName}
            autoComplete="given-name"
          />
        </FormField>

        <FormField label="Cognome" required error={adminErrors.lastName}>
          <TextInput
            value={adminData.lastName}
            onChange={(e) =>
              setAdminData({ ...adminData, lastName: e.target.value })
            }
            placeholder="Rossi"
            error={!!adminErrors.lastName}
            autoComplete="family-name"
          />
        </FormField>
      </div>

      <FormField label="Password" required error={adminErrors.password}>
        <div className="space-y-2">
          <PasswordInput
            value={adminData.password}
            onChange={(e) =>
              setAdminData({ ...adminData, password: e.target.value })
            }
            placeholder="Crea una password sicura"
            error={!!adminErrors.password}
            autoComplete="new-password"
          />
          {adminData.password && (
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
        error={adminErrors.confirmPassword}
      >
        <PasswordInput
          value={adminData.confirmPassword}
          onChange={(e) =>
            setAdminData({ ...adminData, confirmPassword: e.target.value })
          }
          placeholder="Ripeti la password"
          error={!!adminErrors.confirmPassword}
          autoComplete="new-password"
        />
      </FormField>

      {/* Password requirements indicator */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
          Requisiti password:
        </p>
        <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
          <li className="flex items-center">
            <Check
              className={`w-4 h-4 mr-2 ${
                adminData.password.length >= 8
                  ? "text-green-600"
                  : "text-gray-400"
              }`}
            />
            Almeno 8 caratteri
          </li>
          <li className="flex items-center">
            <Check
              className={`w-4 h-4 mr-2 ${
                /[A-Z]/.test(adminData.password)
                  ? "text-green-600"
                  : "text-gray-400"
              }`}
            />
            Una lettera maiuscola
          </li>
          <li className="flex items-center">
            <Check
              className={`w-4 h-4 mr-2 ${
                /[a-z]/.test(adminData.password)
                  ? "text-green-600"
                  : "text-gray-400"
              }`}
            />
            Una lettera minuscola
          </li>
          <li className="flex items-center">
            <Check
              className={`w-4 h-4 mr-2 ${
                /\d/.test(adminData.password)
                  ? "text-green-600"
                  : "text-gray-400"
              }`}
            />
            Un numero
          </li>
        </ul>
      </div>
    </div>
  );

  // Render Step 2: Company Info
  const renderStep2 = () => (
    <div className="space-y-5">
      <FormField label="Nome Azienda" required error={companyErrors.name}>
        <TextInput
          value={companyData.name}
          onChange={(e) =>
            setCompanyData({ ...companyData, name: e.target.value })
          }
          placeholder="Acme S.r.l."
          error={!!companyErrors.name}
          autoComplete="organization"
        />
      </FormField>

      <FormField label="Partita IVA" required error={companyErrors.vat}>
        <TextInput
          value={companyData.vat}
          onChange={(e) => {
            const value = e.target.value.replace(/\D/g, "").slice(0, 11);
            setCompanyData({ ...companyData, vat: value });
          }}
          placeholder="12345678901"
          error={!!companyErrors.vat}
          maxLength={11}
        />
      </FormField>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <FormField label="Settore" required error={companyErrors.sector}>
          <SelectInput
            value={companyData.sector}
            onChange={(e) =>
              setCompanyData({ ...companyData, sector: e.target.value })
            }
            options={INDUSTRIES}
            placeholder="Seleziona settore"
            error={!!companyErrors.sector}
          />
        </FormField>

        <FormField
          label="Dimensione Azienda"
          required
          error={companyErrors.size}
        >
          <SelectInput
            value={companyData.size}
            onChange={(e) =>
              setCompanyData({ ...companyData, size: e.target.value })
            }
            options={COMPANY_SIZES}
            placeholder="Seleziona dimensione"
            error={!!companyErrors.size}
          />
        </FormField>
      </div>

      <FormField
        label="Sito Web"
        error={companyErrors.website}
        hint="Opzionale"
      >
        <TextInput
          type="url"
          value={companyData.website}
          onChange={(e) =>
            setCompanyData({ ...companyData, website: e.target.value })
          }
          placeholder="https://www.azienda.it"
          error={!!companyErrors.website}
          autoComplete="url"
        />
      </FormField>
    </div>
  );

  // Render Step 3: Address
  const renderStep3 = () => (
    <div className="space-y-5">
      <FormField label="Indirizzo" required error={addressErrors.street}>
        <TextInput
          value={addressData.street}
          onChange={(e) =>
            setAddressData({ ...addressData, street: e.target.value })
          }
          placeholder="Via Roma, 123"
          error={!!addressErrors.street}
          autoComplete="street-address"
        />
      </FormField>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <FormField label="Citta" required error={addressErrors.city}>
          <TextInput
            value={addressData.city}
            onChange={(e) =>
              setAddressData({ ...addressData, city: e.target.value })
            }
            placeholder="Milano"
            error={!!addressErrors.city}
            autoComplete="address-level2"
          />
        </FormField>

        <FormField label="Provincia" required error={addressErrors.province}>
          <SelectInput
            value={addressData.province}
            onChange={(e) =>
              setAddressData({ ...addressData, province: e.target.value })
            }
            options={ITALIAN_PROVINCES}
            placeholder="Seleziona provincia"
            error={!!addressErrors.province}
          />
        </FormField>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <FormField label="CAP" required error={addressErrors.postalCode}>
          <TextInput
            value={addressData.postalCode}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, "").slice(0, 5);
              setAddressData({ ...addressData, postalCode: value });
            }}
            placeholder="20100"
            error={!!addressErrors.postalCode}
            maxLength={5}
            autoComplete="postal-code"
          />
        </FormField>

        <FormField label="Paese">
          <TextInput
            value={addressData.country}
            onChange={(e) =>
              setAddressData({ ...addressData, country: e.target.value })
            }
            placeholder="Italy"
            disabled
            autoComplete="country-name"
          />
        </FormField>
      </div>
    </div>
  );

  // Render Step 4: Confirmation
  const renderStep4 = () => (
    <div className="space-y-6">
      {/* Review Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Riepilogo Dati
        </h3>

        {/* Admin Info */}
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 space-y-2">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
            <ShieldCheck className="w-4 h-4 mr-2 text-blue-600" />
            Amministratore
          </h4>
          <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
            <p>
              <span className="font-medium">Nome:</span> {adminData.firstName}{" "}
              {adminData.lastName}
            </p>
            <p>
              <span className="font-medium">Email:</span> {adminData.email}
            </p>
          </div>
        </div>

        {/* Company Info */}
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 space-y-2">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
            <Building2 className="w-4 h-4 mr-2 text-violet-600" />
            Azienda
          </h4>
          <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
            <p>
              <span className="font-medium">Nome:</span> {companyData.name}
            </p>
            <p>
              <span className="font-medium">P.IVA:</span> {companyData.vat}
            </p>
            <p>
              <span className="font-medium">Settore:</span>{" "}
              {INDUSTRIES.find((i) => i.value === companyData.sector)?.label}
            </p>
            <p>
              <span className="font-medium">Dimensione:</span>{" "}
              {COMPANY_SIZES.find((s) => s.value === companyData.size)?.label}
            </p>
            {companyData.website && (
              <p>
                <span className="font-medium">Sito:</span>{" "}
                {companyData.website}
              </p>
            )}
          </div>
        </div>

        {/* Address Info */}
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 space-y-2">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
            <MapPin className="w-4 h-4 mr-2 text-green-600" />
            Sede Legale
          </h4>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            <p>{addressData.street}</p>
            <p>
              {addressData.postalCode} {addressData.city} ({addressData.province}
              )
            </p>
            <p>{addressData.country}</p>
          </div>
        </div>
      </div>

      {/* Agreements */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-6 space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Consensi
        </h3>

        <FormField error={agreementErrors.terms}>
          <Checkbox
            checked={agreementData.terms}
            onChange={(e) =>
              setAgreementData({ ...agreementData, terms: e.target.checked })
            }
            label={
              <span className="text-sm">
                Accetto i{" "}
                <Link
                  href="/terms"
                  className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 underline"
                  target="_blank"
                >
                  Termini e Condizioni
                </Link>{" "}
                *
              </span>
            }
            error={!!agreementErrors.terms}
          />
        </FormField>

        <FormField error={agreementErrors.privacy}>
          <Checkbox
            checked={agreementData.privacy}
            onChange={(e) =>
              setAgreementData({ ...agreementData, privacy: e.target.checked })
            }
            label={
              <span className="text-sm">
                Accetto l'
                <Link
                  href="/privacy"
                  className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 underline"
                  target="_blank"
                >
                  Informativa sulla Privacy
                </Link>{" "}
                *
              </span>
            }
            error={!!agreementErrors.privacy}
          />
        </FormField>

        <FormField>
          <Checkbox
            checked={agreementData.marketing}
            onChange={(e) =>
              setAgreementData({
                ...agreementData,
                marketing: e.target.checked,
              })
            }
            label={
              <span className="text-sm">
                Desidero ricevere comunicazioni marketing e aggiornamenti sul
                prodotto
              </span>
            }
          />
        </FormField>
      </div>
    </div>
  );

  // Render current step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return renderStep1();
      case 1:
        return renderStep2();
      case 2:
        return renderStep3();
      case 3:
        return renderStep4();
      default:
        return null;
    }
  };

  return (
    <AuthLayout>
      <AuthHeader />

      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
        <div className="w-full max-w-4xl">
          {/* Step Indicator */}
          <div className="mb-8">
            <StepIndicator steps={STEPS} currentStep={currentStep} />
          </div>

          {/* Main Card */}
          <AuthCard>
            <AuthCardHeader>
              <AuthCardTitle>
                {STEPS[currentStep].label}
              </AuthCardTitle>
              <AuthCardDescription>
                {STEPS[currentStep].description}
              </AuthCardDescription>
            </AuthCardHeader>

            <AuthCardContent>
              {/* Success Message */}
              {successMessage && (
                <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-start">
                  <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 mr-3 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-green-900 dark:text-green-100">
                      {successMessage}
                    </p>
                    <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                      Verrai reindirizzato alla pagina di login...
                    </p>
                  </div>
                </div>
              )}

              {/* Error Message */}
              {submitError && (
                <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start">
                  <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mr-3 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-900 dark:text-red-100">
                    {submitError}
                  </p>
                </div>
              )}

              {/* Step Content */}
              <div className="animate-in fade-in slide-in-from-right-5 duration-300">
                {renderStepContent()}
              </div>
            </AuthCardContent>

            <AuthCardFooter>
              {/* Navigation Buttons */}
              <div className="flex items-center justify-between gap-4">
                {currentStep > 0 ? (
                  <button
                    type="button"
                    onClick={handleBack}
                    disabled={isLoading}
                    className="inline-flex items-center justify-center px-6 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Indietro
                  </button>
                ) : (
                  <Link
                    href="/login"
                    className="inline-flex items-center justify-center px-6 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Login
                  </Link>
                )}

                <button
                  type="button"
                  onClick={handleNext}
                  disabled={isLoading}
                  className="inline-flex items-center justify-center px-6 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-500/25"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Elaborazione...
                    </>
                  ) : currentStep === STEPS.length - 1 ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Completa Registrazione
                    </>
                  ) : (
                    <>
                      Avanti
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </button>
              </div>

              {/* Step Counter (Mobile) */}
              <div className="md:hidden text-center text-sm text-gray-500 dark:text-gray-400 mt-4">
                Passo {currentStep + 1} di {STEPS.length}
              </div>
            </AuthCardFooter>
          </AuthCard>

          {/* Additional Info */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Hai gia un account?{" "}
              <Link
                href="/login"
                className="font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
              >
                Accedi ora
              </Link>
            </p>
          </div>
        </div>
      </div>

      <AuthFooter />
    </AuthLayout>
  );
}