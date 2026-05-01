/**
 * Time-Off Calendar Page
 * Visualizza calendario ferie per team
 */
import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import AppShell from '@/components/layout/AppShell';
import PageLoader from '@/components/layout/PageLoader';
import TimeOffCalendar from '@/components/time-off/TimeOffCalendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/lib/AuthContext';

export default function TimeOffCalendarPage() {
  const { user } = useAuth();
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDepartments();
  }, [user?.company_id]);

  const loadDepartments = async () => {
    try {
      if (!user?.company_id) return;

      const employees = await base44.entities.EmployeeProfile.filter({
        company_id: user.company_id,
        status: 'active'
      });

      const uniqueDepts = [...new Set(employees.map(e => e.department).filter(Boolean))].sort();
      setDepartments(uniqueDepts);
    } catch (error) {
      console.error('Failed to load departments:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <PageLoader />;

  return (
    <AppShell user={user}>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-slate-900">Calendario Ferie</h1>
          
          {departments.length > 0 && (
            <Select value={selectedDepartment || ''} onValueChange={setSelectedDepartment}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Tutti i dipartimenti" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={null}>Tutti i dipartimenti</SelectItem>
                {departments.map(dept => (
                  <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        <TimeOffCalendar 
          companyId={user?.company_id} 
          departmentFilter={selectedDepartment}
        />
      </div>
    </AppShell>
  );
}