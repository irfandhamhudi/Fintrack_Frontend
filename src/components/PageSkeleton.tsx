export function PageSkeleton() {
  return (
    <div className="page-skeleton" aria-busy="true" aria-label="Memuat halaman">
      <div className="skeleton-heading">
        <span className="skeleton-line skeleton-title" />
        <span className="skeleton-line skeleton-subtitle" />
      </div>
      <div className="skeleton-kpi-grid">
        {Array.from({ length: 4 }, (_, index) => <div className="skeleton-block skeleton-kpi" key={index} />)}
      </div>
      <div className="skeleton-content-grid">
        <div className="skeleton-block skeleton-panel" />
        <div className="skeleton-block skeleton-panel" />
      </div>
      <div className="skeleton-block skeleton-wide-panel" />
    </div>
  );
}

