import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * Rileva sovrapposizioni turni e mancanza di copertura
 * Triggerato dopo assegnazione turno
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { shift_assignment_id, company_id } = await req.json();

    if (!shift_assignment_id || !company_id) {
      return Response.json({ error: 'Missing parameters' }, { status: 400 });
    }

    // Ottieni l'assegnazione turno
    const assignments = await base44.asServiceRole.entities.ShiftAssignment.filter({
      id: shift_assignment_id
    });

    if (!assignments[0]) {
      return Response.json({ error: 'Assignment not found' }, { status: 404 });
    }

    const assignment = assignments[0];
    const alerts = [];

    // 1. RILEVA SOVRAPPOSIZIONI
    const overlapping = await base44.asServiceRole.entities.ShiftAssignment.filter({
      company_id,
      employee_id: assignment.employee_id,
      shift_date: assignment.shift_date,
      status: { $ne: 'cancelled' }
    });

    const overlappingAssignments = overlapping.filter(a => 
      a.id !== assignment.id &&
      timesOverlap(
        assignment.start_time, assignment.end_time,
        a.start_time, a.end_time
      )
    );

    if (overlappingAssignments.length > 0) {
      const overlapAlert = await base44.asServiceRole.entities.ShiftCoverageAlert.create({
        company_id,
        alert_type: 'overlap',
        alert_date: assignment.shift_date,
        start_time: assignment.start_time,
        end_time: assignment.end_time,
        location_id: assignment.location_id,
        location_name: assignment.location_name,
        affected_employees: [{
          employee_id: assignment.employee_id,
          employee_name: assignment.employee_name,
          shift_assignment_id: assignment.id
        }],
        severity: 'high',
        status: 'pending',
        created_at: new Date().toISOString()
      });
      alerts.push({ type: 'overlap', id: overlapAlert.id });
    }

    // 2. RILEVA MANCANZA COPERTURA
    if (assignment.location_id) {
      const allShiftsOnDate = await base44.asServiceRole.entities.ShiftAssignment.filter({
        company_id,
        location_id: assignment.location_id,
        shift_date: assignment.shift_date,
        status: { $ne: 'cancelled' }
      });

      // Ottieni requisiti di copertura per sede
      const locations = await base44.asServiceRole.entities.CompanyLocation.filter({
        id: assignment.location_id
      });

      const location = locations[0];
      const requiredCoverage = location?.min_shift_coverage || 1;

      // Analizza ogni fascia oraria
      const timeSlots = generateTimeSlots(assignment.start_time, assignment.end_time);
      
      for (const timeSlot of timeSlots) {
        const employeesInSlot = new Set();
        
        allShiftsOnDate.forEach(shift => {
          if (timesOverlap(timeSlot.start, timeSlot.end, shift.start_time, shift.end_time)) {
            employeesInSlot.add(shift.employee_id);
          }
        });

        if (employeesInSlot.size < requiredCoverage) {
          const coverageAlert = await base44.asServiceRole.entities.ShiftCoverageAlert.create({
            company_id,
            alert_type: 'low_coverage',
            alert_date: assignment.shift_date,
            start_time: timeSlot.start,
            end_time: timeSlot.end,
            location_id: assignment.location_id,
            location_name: assignment.location_name,
            affected_employees: Array.from(employeesInSlot).map(empId => ({
              employee_id: empId,
              employee_name: empId
            })),
            required_coverage: requiredCoverage,
            current_coverage: employeesInSlot.size,
            severity: requiredCoverage - employeesInSlot.size > 1 ? 'high' : 'medium',
            status: 'pending',
            created_at: new Date().toISOString()
          });
          alerts.push({ type: 'low_coverage', id: coverageAlert.id });
        }
      }
    }

    // Notifica HR
    if (alerts.length > 0) {
      await base44.asServiceRole.functions.invoke('notifyShiftAlerts', {
        company_id,
        alerts,
        assignment_id: shift_assignment_id
      });
    }

    console.log(`✅ Shift alerts detected: ${alerts.length}`);
    return Response.json({ processed: true, alerts_count: alerts.length });

  } catch (error) {
    console.error('❌ Error in detectShiftAlerts:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

/**
 * Verifica se due intervalli di tempo si sovrappongono
 */
function timesOverlap(start1, end1, start2, end2) {
  return start1 < end2 && start2 < end1;
}

/**
 * Genera slot orari di 30 min per analisi copertura
 */
function generateTimeSlots(startTime, endTime) {
  const slots = [];
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);
  
  let current = startHour * 60 + startMin;
  const end = endHour * 60 + endMin;
  
  while (current < end) {
    const slotStart = Math.floor(current / 60);
    const slotStartMin = current % 60;
    const slotEnd = Math.floor((current + 30) / 60);
    const slotEndMin = (current + 30) % 60;
    
    slots.push({
      start: `${String(slotStart).padStart(2, '0')}:${String(slotStartMin).padStart(2, '0')}`,
      end: `${String(slotEnd).padStart(2, '0')}:${String(slotEndMin).padStart(2, '0')}`
    });
    
    current += 30;
  }
  
  return slots;
}