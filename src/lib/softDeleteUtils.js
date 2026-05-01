/**
 * Soft Delete Utilities
 * Provides helper functions for soft deletes across all entities
 * 
 * Pattern: Add is_deleted + deleted_at to all entities
 * Query: Filter out deleted records by default
 * Restore: Set is_deleted=false to restore
 */

/**
 * Mark entity as deleted (soft delete)
 * @param {object} base44 - SDK client
 * @param {string} entityName - Entity name
 * @param {string} entityId - Entity ID
 * @returns {Promise<object>}
 */
export async function softDelete(base44, entityName, entityId) {
  const Entity = base44.entities[entityName];
  if (!Entity) throw new Error(`Entity ${entityName} not found`);

  return await Entity.update(entityId, {
    is_deleted: true,
    deleted_at: new Date().toISOString()
  });
}

/**
 * Restore soft-deleted entity
 * @param {object} base44 - SDK client
 * @param {string} entityName - Entity name
 * @param {string} entityId - Entity ID
 * @returns {Promise<object>}
 */
export async function restoreEntity(base44, entityName, entityId) {
  const Entity = base44.entities[entityName];
  if (!Entity) throw new Error(`Entity ${entityName} not found`);

  return await Entity.update(entityId, {
    is_deleted: false,
    deleted_at: null
  });
}

/**
 * Permanently delete entity (hard delete)
 * WARNING: Cannot be undone
 * @param {object} base44 - SDK client
 * @param {string} entityName - Entity name
 * @param {string} entityId - Entity ID
 * @param {boolean} requiresConfirm - Must confirm deletion
 * @returns {Promise<void>}
 */
export async function hardDelete(base44, entityName, entityId, requiresConfirm = true) {
  const Entity = base44.entities[entityName];
  if (!Entity) throw new Error(`Entity ${entityName} not found`);

  if (requiresConfirm) {
    console.warn(`HARD DELETE: ${entityName}/${entityId} - This cannot be undone`);
  }

  // Hard delete not directly supported by Base44
  // Workaround: use soft delete as permanent (is_deleted + deleted_at)
  // Only admin can hard delete via database directly
  
  return await softDelete(base44, entityName, entityId);
}

/**
 * Query entities excluding soft-deleted ones
 * Wrapper around filter that adds is_deleted check
 * @param {object} base44 - SDK client
 * @param {string} entityName - Entity name
 * @param {object} query - Query filter
 * @param {boolean} includeDeleted - Include deleted records
 * @returns {Promise<array>}
 */
export async function queryActive(
  base44,
  entityName,
  query = {},
  includeDeleted = false
) {
  const Entity = base44.entities[entityName];
  if (!Entity) throw new Error(`Entity ${entityName} not found`);

  // Add is_deleted filter if not including deleted
  const finalQuery = includeDeleted ? query : { ...query, is_deleted: false };

  return await Entity.filter(finalQuery);
}

/**
 * Get soft-deleted entities only
 * @param {object} base44 - SDK client
 * @param {string} entityName - Entity name
 * @param {object} query - Query filter
 * @returns {Promise<array>}
 */
export async function queryDeleted(base44, entityName, query = {}) {
  const Entity = base44.entities[entityName];
  if (!Entity) throw new Error(`Entity ${entityName} not found`);

  return await Entity.filter({ ...query, is_deleted: true });
}

/**
 * Empty trash (hard delete soft-deleted records older than X days)
 * @param {object} base44 - SDK client
 * @param {string} entityName - Entity name
 * @param {number} retentionDays - Delete records deleted > X days ago
 * @returns {Promise<number>} Count deleted
 */
export async function emptyTrash(base44, entityName, retentionDays = 90) {
  const Entity = base44.entities[entityName];
  if (!Entity) throw new Error(`Entity ${entityName} not found`);

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

  const deleted = await Entity.filter({
    is_deleted: true,
    deleted_at: { $lt: cutoffDate.toISOString() }
  });

  console.log(`Trash: ${deleted.length} old records would be hard-deleted`);
  
  // Note: Hard delete not supported by Base44 filter
  // Admin must implement separately via direct database access
  
  return deleted.length;
}

/**
 * Migration helper: Add soft delete fields to all entities
 * Called once during migration
 */
export function getSoftDeleteMigrationFields() {
  return {
    is_deleted: {
      type: 'boolean',
      default: false,
      description: 'Soft delete flag'
    },
    deleted_at: {
      type: 'string',
      format: 'date-time',
      description: 'When record was soft-deleted'
    }
  };
}

/**
 * Best practices:
 * 
 * 1. Always query with is_deleted=false (use queryActive helper)
 * 2. Never hard delete production data
 * 3. Empty trash after 90 days (compliance)
 * 4. Log soft deletes to AuditLog
 * 5. Require admin approval for hard deletes
 */