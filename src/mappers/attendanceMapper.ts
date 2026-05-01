/**
 * src/mappers/attendanceMapper.ts
 * ===============================
 */

export const attendanceMapper = {
  toViewModel(raw: any) {
    if (!raw) return null;

    return {
      id: raw.id,
      employeeId: raw.employee_id,
      entryType: raw.entry_type,
      timestamp: raw.timestamp,
      latitude: raw.latitude,
      longitude: raw.longitude,
      geofenceValid: raw.geofence_valid,
      ipAddress: raw.ip_address,
      notes: raw.notes,
      createdAt: raw.created_at,
    };
  },

  toApiPayload(data: any) {
    return {
      employee_id: data.employee_id,
      entry_type: data.entry_type,
      timestamp: data.timestamp,
      latitude: data.latitude,
      longitude: data.longitude,
      geofence_valid: data.geofence_valid,
      ip_address: data.ip_address,
      notes: data.notes,
    };
  },
};