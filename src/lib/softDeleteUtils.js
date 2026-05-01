/**
 * Soft Delete Utilities
 * Helpers for implementing soft delete (is_deleted + deleted_at fields)
 */

/**
 * Apply soft delete filter to query
 * Excludes records where is_deleted = true
 */
export function applySoftDeleteFilter(query = {}) {
  return {
    ...query,
    is_deleted: { $ne: true }
  };
}

/**
 * Soft delete a record
 * Sets is_deleted=true and deleted_at=now
 */
export async function softDelete(base44, entityName, recordId) {
  try {
    return await base44.asServiceRole.entities[entityName].update(recordId, {
      is_deleted: true,
      deleted_at: new Date().toISOString()
    });
  } catch (error) {
    console.error(`Soft delete failed for ${entityName}:`, error);
    throw error;
  }
}

/**
 * Permanently delete a record (hard delete)
 * Only use for compliance (GDPR) or cleanup
 */
export async function hardDelete(base44, entityName, recordId) {
  try {
    return await base44.asServiceRole.entities[entityName].delete(recordId);
  } catch (error) {
    console.error(`Hard delete failed for ${entityName}:`, error);
    throw error;
  }
}

/**
 * Restore a soft-deleted record
 */
export async function restoreDeleted(base44, entityName, recordId) {
  try {
    return await base44.asServiceRole.entities[entityName].update(recordId, {
      is_deleted: false,
      deleted_at: null
    });
  } catch (error) {
    console.error(`Restore failed for ${entityName}:`, error);
    throw error;
  }
}

/**
 * List only deleted records (for admin cleanup)
 */
export async function getDeletedRecords(base44, entityName, companyId) {
  try {
    return await base44.asServiceRole.entities[entityName].filter({
      company_id: companyId,
      is_deleted: true
    });
  } catch (error) {
    console.error(`Failed to fetch deleted ${entityName} records:`, error);
    throw error;
  }
}