/**
 * hooks/useCurrentCompany.js
 * Hook centralizzato per azienda corrente selezionata
 * Obbligatorio: multi-tenancy deve sempre sapere su quale azienda operare
 */

import { useState, useContext, createContext } from 'react';

export const CompanyContext = createContext(null);

export const useCurrentCompany = () => {
  const context = useContext(CompanyContext);
  
  if (!context) {
    throw new Error('useCurrentCompany deve essere usato dentro CompanyProvider');
  }
  
  return context;
};

export const CompanyProvider = ({ children, initialCompany = null }) => {
  const [currentCompany, setCurrentCompany] = useState(initialCompany);
  const [isLoading, setIsLoading] = useState(false);

  const switchCompany = async (company) => {
    setIsLoading(true);
    try {
      // TODO MIGRATION: Salvare preferenza su backend
      setCurrentCompany(company);
      // Salvare in localStorage come fallback
      if (company?.id) {
        localStorage.setItem('currentCompanyId', company.id);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <CompanyContext.Provider
      value={{
        currentCompany,
        setCurrentCompany,
        switchCompany,
        isLoading,
      }}
    >
      {children}
    </CompanyContext.Provider>
  );
};