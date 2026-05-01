import React, { memo } from 'react';
import { Mail, Phone, MapPin, Badge } from 'lucide-react';

/**
 * EmployeeCard - Memoized for performance
 * Renders single employee card without re-rendering siblings
 */
const EmployeeCard = memo(({ employee, onClick }) => {
  const getStatusColor = (status) => {
    switch(status) {
      case 'active': return 'bg-emerald-100 text-emerald-700';
      case 'onboarding': return 'bg-blue-100 text-blue-700';
      case 'inactive': return 'bg-slate-100 text-slate-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const getStatusLabel = (status) => {
    switch(status) {
      case 'active': return '✅ Attivo';
      case 'onboarding': return '🚀 Onboarding';
      case 'inactive': return '⏸️ Inattivo';
      default: return status;
    }
  };

  return (
    <div
      onClick={onClick}
      className="bg-white border border-slate-200 rounded-lg p-5 hover:shadow-lg hover:border-blue-300 transition-all cursor-pointer"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="font-semibold text-slate-900 text-lg">
            {employee.first_name} {employee.last_name}
          </h3>
          <p className="text-sm text-slate-600">{employee.job_title}</p>
        </div>
        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${getStatusColor(employee.status)}`}>
          {getStatusLabel(employee.status)}
        </span>
      </div>

      {/* Contact Info */}
      <div className="space-y-2 mb-4 text-sm">
        {employee.email && (
          <div className="flex items-center gap-2 text-slate-600">
            <Mail className="w-4 h-4 text-slate-400" />
            <span className="truncate">{employee.email}</span>
          </div>
        )}
        {employee.phone && (
          <div className="flex items-center gap-2 text-slate-600">
            <Phone className="w-4 h-4 text-slate-400" />
            {employee.phone}
          </div>
        )}
        {employee.department && (
          <div className="flex items-center gap-2 text-slate-600">
            <Badge className="w-4 h-4 text-slate-400" />
            {employee.department}
          </div>
        )}
        {employee.location && (
          <div className="flex items-center gap-2 text-slate-600">
            <MapPin className="w-4 h-4 text-slate-400" />
            {employee.location}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="pt-4 border-t border-slate-100 text-xs text-slate-500">
        Assunto: {new Date(employee.hire_date).toLocaleDateString('it-IT')}
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  return prevProps.employee.id === nextProps.employee.id;
});

EmployeeCard.displayName = 'EmployeeCard';

export default EmployeeCard;