export function SkeletonBlock({ width, height, radius, className = "", style }) {
  return (
    <span
      className={`skeleton-block ${className}`.trim()}
      style={{ width, height, borderRadius: radius, ...style }}
    />
  );
}

export function SkeletonText({ width = "100%", className = "", style }) {
  return <span className={`skeleton-block skeleton-text ${className}`.trim()} style={{ width, ...style }} />;
}

export function SkeletonStatGrid({ count = 4, containerClassName = "stat-grid" }) {
  return (
    <div className={containerClassName} role="status" aria-label="Loading">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="stat-card">
          <SkeletonText width="55%" className="skeleton-stat-label" />
          <SkeletonText width="35%" className="skeleton-stat-value" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonTable({ rows = 6, columns = 5 }) {
  return (
    <div className="table-wrap" role="status" aria-label="Loading">
      <table>
        <thead>
          <tr>
            {Array.from({ length: columns }).map((_, index) => (
              <th key={index}>
                <SkeletonText width="60%" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <tr key={rowIndex}>
              {Array.from({ length: columns }).map((_, colIndex) => (
                <td key={colIndex}>
                  <SkeletonText width={colIndex === 0 ? "85%" : "55%"} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function SkeletonCardGrid({ count = 6 }) {
  return (
    <div className="course-grid" role="status" aria-label="Loading courses">
      {Array.from({ length: count }).map((_, index) => (
        <article key={index} className="course-card">
          <div className="course-image-wrap">
            <SkeletonBlock height="100%" radius="0" />
          </div>
          <div className="course-content">
            <SkeletonText width="35%" />
            <SkeletonText width="90%" style={{ height: "1.1rem" }} />
            <SkeletonText width="75%" />
            <div className="skeleton-card-meta">
              <SkeletonText width="70px" />
              <SkeletonBlock width="90px" height="36px" radius="10px" />
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

export function SkeletonBlockList({ count = 4, height = "64px" }) {
  return (
    <div className="skeleton-block-list" role="status" aria-label="Loading">
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonBlock key={index} height={height} radius="14px" />
      ))}
    </div>
  );
}

export function SkeletonPanel({ lines = 4, titleWidth = "30%", className = "panel-card" }) {
  return (
    <div className={className} role="status" aria-label="Loading">
      <SkeletonText width={titleWidth} style={{ height: "1.1rem", marginBottom: "0.75rem" }} />
      <div className="skeleton-lines">
        {Array.from({ length: lines }).map((_, index) => (
          <SkeletonText key={index} width={index === lines - 1 ? "60%" : "100%"} />
        ))}
      </div>
    </div>
  );
}
