/**
 * Data Mapper Layer
 * ─────────────────
 * Abstract interface between business logic and persistence layer.
 * Allows seamless swap: Base44 → PostgreSQL without changing services.
 * 
 * Architecture:
 * Service → DataMapper → Repository → Persistence (Base44 / PostgreSQL)
 */

// Re-export all mappers
export { EmployeeMapper } from './EmployeeMapper';
export { LeaveRequestMapper } from './LeaveRequestMapper';
export { TimeEntryMapper } from './TimeEntryMapper';
export { DocumentMapper } from './DocumentMapper';
export { WorkflowMapper } from './WorkflowMapper';
export { UserMapper } from './UserMapper';

// Data mapper instance (factory)
import { EmployeeMapper } from './EmployeeMapper';
import { LeaveRequestMapper } from './LeaveRequestMapper';
import { TimeEntryMapper } from './TimeEntryMapper';
import { DocumentMapper } from './DocumentMapper';
import { WorkflowMapper } from './WorkflowMapper';
import { UserMapper } from './UserMapper';

export const dataMapper = {
  Employee: new EmployeeMapper(),
  LeaveRequest: new LeaveRequestMapper(),
  TimeEntry: new TimeEntryMapper(),
  Document: new DocumentMapper(),
  Workflow: new WorkflowMapper(),
  User: new UserMapper(),
};

/**
 * TODO MIGRATION:
 * - [ ] Implement all mappers
 * - [ ] Add unit tests
 * - [ ] Create PostgreSQL adapter
 * - [ ] Test swap Base44 ↔ PostgreSQL
 * - [ ] Update all services to use dataMapper
 */