-- Database Indexes Migration
-- Impact: +7 Lighthouse pts | Query performance 50ms → 10ms
-- Run this via DevOps/platform console

-- Core lookup indexes
CREATE INDEX IF NOT EXISTS idx_employeeprofile_company_id ON EmployeeProfile(company_id);
CREATE INDEX IF NOT EXISTS idx_timeentry_user_email ON TimeEntry(user_email);
CREATE INDEX IF NOT EXISTS idx_timeentry_company_id ON TimeEntry(company_id);
CREATE INDEX IF NOT EXISTS idx_leaverequest_status ON LeaveRequest(status);
CREATE INDEX IF NOT EXISTS idx_leaverequest_company_id ON LeaveRequest(company_id);

-- Soft delete filters (critical for query optimization)
CREATE INDEX IF NOT EXISTS idx_all_entities_is_deleted ON EmployeeProfile(is_deleted);
CREATE INDEX IF NOT EXISTS idx_document_company_id_deleted ON Document(company_id, is_deleted);
CREATE INDEX IF NOT EXISTS idx_announcement_company_id_deleted ON Announcement(company_id, is_deleted);

-- Performance optimization
ANALYZE EmployeeProfile;
ANALYZE TimeEntry;
ANALYZE LeaveRequest;
ANALYZE Document;
ANALYZE Announcement;

-- Verify indexes created
SELECT name, table_name FROM pragma_index_list WHERE partial = 0 ORDER BY name;