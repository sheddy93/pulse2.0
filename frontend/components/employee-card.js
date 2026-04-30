export function EmployeeCard({ employee }) {
  const fullName =
    employee.full_name ||
    employee.name ||
    `${employee.first_name || ""} ${employee.last_name || ""}`.trim();
  const subtitle = [
    employee.job_title || employee.role,
    employee.department?.name || employee.department,
  ]
    .filter(Boolean)
    .join(" - ");

  return (
    <div className="detail-row">
      <strong>{fullName || employee.employee_code}</strong>
      <p>{subtitle || employee.employee_code}</p>
    </div>
  );
}
