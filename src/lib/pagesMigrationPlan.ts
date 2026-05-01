/**
 * Piano migrazione pagine: base44 SDK → REST API
 * 
 * Strategia: 
 * - Scan tutte le pagine per base44 imports
 * - Sostituisci base44.auth.* con authService
 * - Sostituisci base44.entities.X con restAdapter.entities.X
 * - Mantieni logica UI intatta
 */

export const pagesToMigrate = [
  // Company pages
  'src/pages/company/CompanyAttendancePage.jsx',
  'src/pages/company/CompanySettings.jsx',
  'src/pages/company/ExpenseManagement.jsx',
  'src/pages/company/GeofenceManagement.jsx',
  'src/pages/company/IntegrationSettings.jsx',
  'src/pages/company/ManagerLeaveRequests.jsx',
  'src/pages/company/PayrollExport.jsx',
  'src/pages/company/WorkflowConfiguration.jsx',

  // Employee pages
  'src/pages/employee/AttendancePage.jsx',
  'src/pages/employee/Chat.jsx',
  'src/pages/employee/EmployeeExpenses.jsx',
  'src/pages/employee/LeaveRequestPage.jsx',

  // Consultant pages
  'src/pages/consultant/LinkRequests.jsx',
  'src/pages/consultant/ConsultantSettings.jsx',

  // Admin pages
  'src/pages/dashboard/AdminAnalytics.jsx',
  'src/pages/dashboard/AdminCompanies.jsx',
  'src/pages/dashboard/AdminUsers.jsx',
  'src/pages/dashboard/AdminSystem.jsx',
];

export const replacementMap = {
  'base44.auth.me()': 'authService.me()',
  'base44.auth.isAuthenticated()': 'authService.isAuthenticated()',
  'base44.auth.logout()': 'authService.logout()',
  'base44.auth.updateMe(data)': 'authService.updateMe(data)',
  'base44.entities.Employee': 'restAdapter.entities.Employee',
  'base44.entities.LeaveRequest': 'restAdapter.entities.LeaveRequest',
  'base44.entities.AttendanceEntry': 'restAdapter.entities.AttendanceEntry',
  'base44.entities.Company': 'restAdapter.entities.Company',
  'base44.entities.Document': 'restAdapter.entities.Document',
  'base44.entities.LeaveBalance': 'restAdapter.entities.LeaveBalance',
};