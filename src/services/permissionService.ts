/**
 * src/services/permissionService.ts
 * =================================
 * Permessi e RBAC
 * 
 * Centralizza tutta la logica di autorizzazione
 * Deve essere replicato lato NestJS con Guards
 * 
 * TODO MIGRATION: replicare con Guards di NestJS
 */

import { ROLE_PERMISSIONS } from '@/lib/permissions';

export const permissionService = {
  /**
   * can(user, permission, resource?)
   * Verifica se user ha permission
   * 
   * @param user - Utente attuale
   * @param permission - Nome permesso (es. 'create_employee')
   * @param resource - Risorsa optional per check specifico (es. { companyId, employeeId })
   * @returns boolean
   */
  can(user: any, permission: string, resource?: any): boolean {
    if (!user || !user.role) return false;

    // Super admin può fare tutto
    if (user.role === 'super_admin') return true;

    // Get permessi per ruolo
    const rolePerms = ROLE_PERMISSIONS[user.role] || [];
    const hasPermission = rolePerms.includes(permission);

    if (!hasPermission) return false;

    // Check tenant isolation se risorsa è specificata
    if (resource?.companyId && user.company_id !== resource.companyId) {
      return false;
    }

    return true;
  },

  /**
   * canView(user, resource)
   * Verifica se user può visualizzare risorsa
   */
  canView(user: any, resource: any): boolean {
    if (user.role === 'super_admin') return true;

    // Stesso tenant
    if (user.company_id !== resource.company_id) return false;

    // Dipendente vede solo il suo profilo
    if (
      user.role === 'employee' &&
      resource.id &&
      user.employee_id !== resource.id
    ) {
      return false;
    }

    return true;
  },

  /**
   * canEdit(user, resource)
   * Verifica se user può modificare risorsa
   */
  canEdit(user: any, resource: any): boolean {
    if (!this.canView(user, resource)) return false;

    // Dipendente modifica solo se è il proprietario
    if (user.role === 'employee' && user.employee_id !== resource.id) {
      return false;
    }

    return true;
  },

  /**
   * canDelete(user, resource)
   */
  canDelete(user: any, resource: any): boolean {
    if (!this.canEdit(user, resource)) return false;

    // Dipendente non può cancellare nulla
    if (user.role === 'employee') return false;

    return true;
  },

  /**
   * getTenantFilter(user)
   * Ritorna filter per query database (tenant isolation)
   */
  getTenantFilter(user: any): any {
    if (user.role === 'super_admin') {
      return {}; // Vede tutto
    }

    return {
      company_id: user.company_id,
    };
  },

  /**
   * getVisibleRoles(currentUserRole)
   * Quali ruoli può gestire questo utente
   */
  getVisibleRoles(currentUserRole: string): string[] {
    const roles: Record<string, string[]> = {
      super_admin: [
        'super_admin',
        'company_owner',
        'company_admin',
        'hr_manager',
        'manager',
        'employee',
        'external_consultant',
      ],
      company_owner: [
        'company_admin',
        'hr_manager',
        'manager',
        'employee',
        'external_consultant',
      ],
      company_admin: ['hr_manager', 'manager', 'employee'],
      hr_manager: ['employee'],
      manager: [],
      employee: [],
      external_consultant: [],
    };

    return roles[currentUserRole] || [];
  },
};