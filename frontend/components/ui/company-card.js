export function CompanyCard({ company }) {
  return (
    <div className="detail-row">
      <strong>{company.name}</strong>
      <p>{company.plan || "Nessun piano"} - {company.users_count} utenti</p>
    </div>
  );
}
