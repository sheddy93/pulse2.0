export function SidebarSection({ children, title }) {
  return (
    <section className="stack-card">
      {title ? <p className="page-eyebrow">{title}</p> : null}
      {children}
    </section>
  );
}
