export default function StatCard({ label, value, delta, tone }) {
  const toneColor = {
    critical: 'var(--severity-critical)',
    high: 'var(--severity-high)',
    good: 'var(--status-good)',
    neutral: 'var(--text-primary)',
  }[tone || 'neutral'];

  return (
    <div className="stat-card">
      <div className="label">{label}</div>
      <div className="value" style={{ color: toneColor }}>
        {value}
      </div>
      {delta && <div className="delta">{delta}</div>}
    </div>
  );
}
