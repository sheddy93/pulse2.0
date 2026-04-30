/**
 * Forms Component Library
 * 
 * Professional form components for PulseHR multi-step registration
 * Includes validation, accessibility, and dark mode support
 */

export { default as StepIndicator } from './step-indicator';
export { default as FormField } from './form-field';
export { default as TextInput } from './text-input';
export { default as PasswordInput } from './password-input';
export { default as SelectInput } from './select-input';
export { default as Checkbox } from './checkbox';

/**
 * Form Validation Utilities
 */

/**
 * Validate required field
 * @param {string} value - Field value
 * @returns {string|null} Error message or null
 */
export const validateRequired = (value) => {
  if (!value || value.trim() === '') {
    return 'Questo campo è obbligatorio';
  }
  return null;
};

/**
 * Validate email format
 * @param {string} email - Email address
 * @returns {string|null} Error message or null
 */
export const validateEmail = (email) => {
  if (!email) return 'L\'email è obbligatoria';
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return 'Inserisci un indirizzo email valido';
  }
  
  return null;
};

/**
 * Validate password strength
 * @param {string} password - Password
 * @returns {string|null} Error message or null
 */
export const validatePassword = (password) => {
  if (!password) return 'La password è obbligatoria';
  
  if (password.length < 8) {
    return 'La password deve contenere almeno 8 caratteri';
  }
  
  if (!/[A-Z]/.test(password)) {
    return 'La password deve contenere almeno una lettera maiuscola';
  }
  
  if (!/[a-z]/.test(password)) {
    return 'La password deve contenere almeno una lettera minuscola';
  }
  
  if (!/\d/.test(password)) {
    return 'La password deve contenere almeno un numero';
  }
  
  return null;
};

/**
 * Validate password confirmation
 * @param {string} password - Original password
 * @param {string} confirmPassword - Confirmation password
 * @returns {string|null} Error message or null
 */
export const validatePasswordMatch = (password, confirmPassword) => {
  if (!confirmPassword) return 'Conferma la password';
  
  if (password !== confirmPassword) {
    return 'Le password non coincidono';
  }
  
  return null;
};

/**
 * Validate phone number (Italian format)
 * @param {string} phone - Phone number
 * @returns {string|null} Error message or null
 */
export const validatePhone = (phone) => {
  if (!phone) return null; // Optional field
  
  const phoneRegex = /^(\+39)?[\s]?((3[1-9]\d)|(0[1-9]\d{1,3}))[\s]?\d{5,7}$/;
  if (!phoneRegex.test(phone.replace(/\s/g, ''))) {
    return 'Inserisci un numero di telefono valido';
  }
  
  return null;
};

/**
 * Validate VAT number (Partita IVA italiana)
 * @param {string} vat - VAT number
 * @returns {string|null} Error message or null
 */
export const validateVAT = (vat) => {
  if (!vat) return 'La partita IVA è obbligatoria';
  
  const vatRegex = /^\d{11}$/;
  if (!vatRegex.test(vat)) {
    return 'La partita IVA deve contenere 11 cifre';
  }
  
  return null;
};

/**
 * Validate fiscal code (Codice Fiscale italiano)
 * @param {string} fiscalCode - Fiscal code
 * @returns {string|null} Error message or null
 */
export const validateFiscalCode = (fiscalCode) => {
  if (!fiscalCode) return 'Il codice fiscale è obbligatorio';
  
  const fiscalCodeRegex = /^[A-Z]{6}\d{2}[A-Z]\d{2}[A-Z]\d{3}[A-Z]$/i;
  if (!fiscalCodeRegex.test(fiscalCode)) {
    return 'Inserisci un codice fiscale valido';
  }
  
  return null;
};

/**
 * Validate URL
 * @param {string} url - URL
 * @returns {string|null} Error message or null
 */
export const validateURL = (url) => {
  if (!url) return null; // Optional field
  
  try {
    new URL(url);
    return null;
  } catch {
    return 'Inserisci un URL valido';
  }
};

/**
 * Validate minimum length
 * @param {string} value - Value to validate
 * @param {number} minLength - Minimum length
 * @returns {string|null} Error message or null
 */
export const validateMinLength = (value, minLength) => {
  if (!value) return null;
  
  if (value.length < minLength) {
    return `Deve contenere almeno ${minLength} caratteri`;
  }
  
  return null;
};

/**
 * Validate maximum length
 * @param {string} value - Value to validate
 * @param {number} maxLength - Maximum length
 * @returns {string|null} Error message or null
 */
export const validateMaxLength = (value, maxLength) => {
  if (!value) return null;
  
  if (value.length > maxLength) {
    return `Non può superare ${maxLength} caratteri`;
  }
  
  return null;
};
