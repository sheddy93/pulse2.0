/**
 * src/services/attendanceService.ts
 * =================================
 * Business logic per Attendance
 * 
 * TODO MIGRATION: migrare a NestJS
 */

import { attendanceApi } from '@/api/attendanceApi';
import { attendanceMapper } from '@/mappers/attendanceMapper';
import { permissionService } from './permissionService';

export const attendanceService = {
  async checkIn(data: any, currentUser: any) {
    if (!permissionService.can(currentUser, 'create_attendance')) {
      throw new Error('Permission denied');
    }

    // Validazione geofence
    const geoValidation = await attendanceService.validateGeofence(
      data.latitude,
      data.longitude,
      currentUser.company_id
    );

    if (!geoValidation.valid && data.require_geofence) {
      throw new Error(`Outside geofence: ${geoValidation.distance}m away`);
    }

    const payload = attendanceMapper.toApiPayload({
      employee_id: currentUser.employee_id,
      entry_type: 'check_in',
      latitude: data.latitude,
      longitude: data.longitude,
      timestamp: new Date(),
      geofence_valid: geoValidation.valid,
      ...data,
    });

    const entry = await attendanceApi.checkIn(payload);
    return attendanceMapper.toViewModel(entry);
  },

  async checkOut(data: any, currentUser: any) {
    if (!permissionService.can(currentUser, 'create_attendance')) {
      throw new Error('Permission denied');
    }

    const payload = attendanceMapper.toApiPayload({
      employee_id: currentUser.employee_id,
      entry_type: 'check_out',
      timestamp: new Date(),
      ...data,
    });

    const entry = await attendanceApi.checkOut(payload);
    return attendanceMapper.toViewModel(entry);
  },

  async getTodayEntries(employeeId: string) {
    const entries = await attendanceApi.getTodayEntries(employeeId);
    return entries.map(e => attendanceMapper.toViewModel(e));
  },

  async calculateDailySummary(entries: any[]) {
    if (entries.length === 0) return null;

    const checkIn = entries.find(e => e.entry_type === 'check_in');
    const checkOut = entries.find(e => e.entry_type === 'check_out');

    if (!checkIn) return null;

    const startTime = new Date(checkIn.timestamp);
    const endTime = checkOut ? new Date(checkOut.timestamp) : new Date();

    const durationMs = endTime.getTime() - startTime.getTime();
    const durationHours = durationMs / (1000 * 60 * 60);

    return {
      date: checkIn.timestamp.split('T')[0],
      check_in: checkIn.timestamp,
      check_out: checkOut?.timestamp || null,
      duration_hours: parseFloat(durationHours.toFixed(2)),
    };
  },

  async validateGeofence(lat: number, lng: number, companyId: string) {
    // TODO MIGRATION: Call geofence service in NestJS backend
    // For now, simple distance calculation
    // In production: use Google Maps API or Mapbox
    
    const COMPANY_HQ = { lat: 45.5017, lng: 9.1603 }; // Milan
    const GEOFENCE_RADIUS_M = 100;

    const distance = attendanceService.calculateDistance(
      lat,
      lng,
      COMPANY_HQ.lat,
      COMPANY_HQ.lng
    );

    return {
      valid: distance <= GEOFENCE_RADIUS_M,
      distance: Math.round(distance),
      radius: GEOFENCE_RADIUS_M,
    };
  },

  calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number) {
    // Haversine formula
    const R = 6371000; // Earth radius in meters
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  },

  async requestManualCorrection(data: any, currentUser: any) {
    // TODO MIGRATION: POST /api/attendance/corrections
    // Create correction request for manager approval
    throw new Error('Not yet implemented');
  },
};