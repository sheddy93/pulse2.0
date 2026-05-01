/**
 * Mappa di migrazione da base44 SDK a REST API
 * Mapping: base44.entities.X → restAdapter.entities.X
 */

export const migrationMap = {
  // Sostituzioni dirette base44 -> restAdapter
  'base44.entities.Employee': 'restAdapter.entities.Employee',
  'base44.entities.LeaveRequest': 'restAdapter.entities.LeaveRequest',
  'base44.entities.AttendanceEntry': 'restAdapter.entities.AttendanceEntry',
  'base44.entities.Company': 'restAdapter.entities.Company',
  'base44.entities.Document': 'restAdapter.entities.Document',
  'base44.entities.LeaveBalance': 'restAdapter.entities.LeaveBalance',

  // Metodi comuni
  'list()': 'list()',
  'get(id)': 'get(id)',
  'create(data)': 'create(data)',
  'update(id, data)': 'update(id, data)',
  'delete(id)': 'delete(id)',
  'filter(query)': 'filter(query)',
};

export const isBase44Dependency = (identifier: string): boolean => {
  return identifier.includes('base44');
};

export const getMappedImport = (entityName: string): string => {
  return `import { restAdapter } from '@/api/adapters/restAdapter';`;
};