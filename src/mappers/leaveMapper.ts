/**
 * src/mappers/leaveMapper.ts
 * ==========================
 */

export const leaveMapper = {
  toViewModel(raw: any) {
    if (!raw) return null;

    return {
      id: raw.id,
      employeeId: raw.employee_id,
      leaveType: raw.leave_type,
      startDate: raw.start_date,
      endDate: raw.end_date,
      totalDays: raw.total_days,
      reason: raw.reason,
      status: raw.status,
      approvedBy: raw.approved_by,
      approvedAt: raw.approved_at,
      rejectionReason: raw.rejection_reason,
      createdAt: raw.created_at,
      updatedAt: raw.updated_at,
    };
  },

  toApiPayload(data: any) {
    return {
      employee_id: data.employee_id,
      company_id: data.company_id,
      leave_type: data.leave_type,
      start_date: data.start_date,
      end_date: data.end_date,
      total_days: data.total_days,
      reason: data.reason,
      status: data.status,
    };
  },

  balanceToViewModel(raw: any) {
    if (!raw) return null;

    return {
      id: raw.id,
      employeeId: raw.employee_id,
      availableLeave: raw.available_leave,
      usedLeave: raw.used_leave,
      availablePermissions: raw.available_permissions,
      usedPermissions: raw.used_permissions,
      year: raw.year,
    };
  },
};