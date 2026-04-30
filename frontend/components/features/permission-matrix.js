export function PermissionMatrix({ rows }) {
  return (
    <div className="table-shell">
      <div className="timeline-list p-4">
        {rows.map((row) => (
          <div className="metric-row" key={row.label}>
            <strong>{row.label}</strong>
            <span className="muted-text">{row.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
