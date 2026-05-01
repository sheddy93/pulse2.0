/**
 * services/dashboardService.js
 * Logica business per dashboard centralizzata
 * TODO MIGRATION: Layer tra API e componenti dashboard
 */

import { apiClient } from '@/api/client';

/**
 * Fetch statistiche dashboard per super admin
 */
export async function fetchSuperAdminStats() {
  try {
    const [companies, users, subs] = await Promise.all([
      apiClient.getCompanies(),
      // TODO: Implementare getUsers nel apiClient
      apiClient.getSubscription(),
    ]);

    return {
      companies: companies?.length || 0,
      users: 0, // TODO
      activeSubscriptions: subs?.length || 0,
    };
  } catch (err) {
    console.error('Error fetching super admin stats:', err);
    return {
      companies: 0,
      users: 0,
      activeSubscriptions: 0,
    };
  }
}

/**
 * Fetch statistiche dashboard per company owner
 */
export async function fetchCompanyStats(companyId) {
  try {
    const [employees, leaves, overtime, docs] = await Promise.all([
      apiClient.getEmployees({ company_id: companyId }),
      apiClient.getLeaveRequests({ company_id: companyId, status: 'pending' }),
      // TODO: Implementare getOvertimeRequests nel apiClient
      apiClient.getDocuments({ company_id: companyId }),
    ]);

    return {
      employees: employees?.length || 0,
      pendingLeave: leaves?.length || 0,
      pendingOvertime: 0, // TODO
      documents: docs?.filter(d => d.status === 'pending')?.length || 0,
    };
  } catch (err) {
    console.error('Error fetching company stats:', err);
    return {
      employees: 0,
      pendingLeave: 0,
      pendingOvertime: 0,
      documents: 0,
    };
  }
}

/**
 * Fetch statistiche dashboard per manager
 */
export async function fetchManagerStats(managerId, companyId) {
  try {
    const [team, leaves] = await Promise.all([
      apiClient.getEmployees({ manager_id: managerId, company_id: companyId }),
      apiClient.getLeaveRequests({ company_id: companyId, status: 'pending' }),
    ]);

    return {
      teamMembers: team?.length || 0,
      pendingLeave: leaves?.length || 0,
    };
  } catch (err) {
    console.error('Error fetching manager stats:', err);
    return {
      teamMembers: 0,
      pendingLeave: 0,
    };
  }
}

/**
 * Fetch statistiche dashboard per employee
 */
export async function fetchEmployeeStats(userEmail) {
  try {
    const employees = await apiClient.getEmployees({ user_email: userEmail });
    return employees?.[0] || null;
  } catch (err) {
    console.error('Error fetching employee stats:', err);
    return null;
  }
}

/**
 * Fetch statistiche dashboard per consultant
 */
export async function fetchConsultantStats(consultantUserId) {
  try {
    const links = await apiClient.getConsultantLinks({
      consultant_user_id: consultantUserId,
      status: 'active'
    });
    return {
      companies: links?.length || 0,
    };
  } catch (err) {
    console.error('Error fetching consultant stats:', err);
    return {
      companies: 0,
    };
  }
}