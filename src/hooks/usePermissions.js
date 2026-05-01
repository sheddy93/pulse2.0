/**
 * hooks/usePermissions.js
 * Hook per controllare permessi utente
 * Centralizzato e pronto per futura migrazione su backend
 */

import { useAuth } from './useAuth';
import { can, canAny, canAll, getUserPermissions } from '@/lib/permissions';

export const usePermissions = () => {
  const { user } = useAuth();

  const checkPermission = (permission) => {
    return can(user, permission);
  };

  const checkAnyPermission = (permissions) => {
    return canAny(user, permissions);
  };

  const checkAllPermissions = (permissions) => {
    return canAll(user, permissions);
  };

  const getAllPermissions = () => {
    return getUserPermissions(user);
  };

  return {
    checkPermission,
    checkAnyPermission,
    checkAllPermissions,
    getAllPermissions,
    hasPermission: checkPermission, // alias
  };
};