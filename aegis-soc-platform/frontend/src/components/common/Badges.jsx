export function SeverityBadge({ severity }) {
  const level = (severity || 'info').toLowerCase();
  const map = {
    critical: 'badge-critical',
    high: 'badge-high',
    medium: 'badge-medium',
    low: 'badge-low',
    informational: 'badge-info',
  };
  const cls = map[level] || 'badge-info';
  return (
    <span className={`badge ${cls}`}>
      <span className="badge-dot" />
      {level}
    </span>
  );
}

export function StatusBadge({ status }) {
  return <span className="badge badge-status">{(status || '').replace(/_/g, ' ')}</span>;
}
