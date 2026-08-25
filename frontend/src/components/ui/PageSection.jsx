export default function PageSection({ title, action, children, className = "" }) {
  return (
    <section className={`page-section ${className}`}>
      {(title || action) && (
        <div className="page-section-header">
          {title && <h2 className="page-section-title">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}
