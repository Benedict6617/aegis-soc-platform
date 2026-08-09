export function LoadingState({ label = 'Loading...' }) {
  return <div className="loading-state">{label}</div>;
}

export function EmptyState({ label = 'Nothing to show here.' }) {
  return <div className="empty-state">{label}</div>;
}

export function ErrorState({ message }) {
  return (
    <div className="empty-state" style={{ color: 'var(--severity-critical)' }}>
      {message || 'Something went wrong loading this data.'}
    </div>
  );
}
