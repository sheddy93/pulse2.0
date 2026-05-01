/**
 * services/employeeService.js
 * Logica business per dipendenti centralizzata
 * TODO MIGRATION: Layer tra API e componenti
 */

import { apiClient } from '@/api/client';

/**
 * Fetch dipendenti con filtri e sorting
 */
export async function fetchEmployees(companyId, filters = {}) {
  const query = {
    company_id: companyId,
    ...filters,
  };
  return await apiClient.getEmployees(query);
}

/**
 * Fetch dipendente singolo
 */
export async function fetchEmployee(employeeId) {
  return await apiClient.getEmployee(employeeId);
}

/**
 * Crea nuovo dipendente
 */
export async function createNewEmployee(companyId, data) {
  return await apiClient.createEmployee({
    company_id: companyId,
    ...data,
  });
}

/**
 * Aggiorna dipendente
 */
export async function updateEmployeeData(employeeId, data) {
  return await apiClient.updateEmployee(employeeId, data);
}

/**
 * Cancella dipendente (soft delete)
 */
export async function deleteEmployeeData(employeeId) {
  return await apiClient.deleteEmployee(employeeId);
}

/**
 * Fetch dipartimenti aziendali
 */
export async function fetchDepartments(companyId) {
  return await apiClient.getDepartments({ company_id: companyId });
}

/**
 * Filtro e ordinamento client-side
 * TODO MIGRATION: Domani nel backend con query params
 */
export function filterAndSort(employees, filters = {}) {
  let result = [...employees];

  // Filtro stato
  if (filters.status && filters.status !== 'all') {
    result = result.filter(e => e.employment_status === filters.status);
  }

  // Filtro dipartimento
  if (filters.department && filters.department !== 'all') {
    result = result.filter(e => e.department_id === filters.department);
  }

  // Filtro ricerca nome/email
  if (filters.search) {
    const q = filters.search.toLowerCase();
    result = result.filter(e =>
      e.first_name.toLowerCase().includes(q) ||
      e.last_name.toLowerCase().includes(q) ||
      e.email.toLowerCase().includes(q)
    );
  }

  // Sorting
  if (filters.sort === 'name-asc') {
    result.sort((a, b) => `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`));
  } else if (filters.sort === 'name-desc') {
    result.sort((a, b) => `${b.first_name} ${b.last_name}`.localeCompare(`${a.first_name} ${a.last_name}`));
  } else if (filters.sort === 'hire-date-asc') {
    result.sort((a, b) => new Date(a.hire_date) - new Date(b.hire_date));
  } else if (filters.sort === 'hire-date-desc') {
    result.sort((a, b) => new Date(b.hire_date) - new Date(a.hire_date));
  }

  return result;
}