import { useEffect, useState } from 'react';
import { playbooksApi } from '../api/endpoints';
import { LoadingState, EmptyState, ErrorState } from '../components/common/States';

export default function Playbooks() {
  const [playbooks, setPlaybooks] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    playbooksApi
      .list()
      .then((res) => setPlaybooks(res.data.data))
      .catch(() => setError('Failed to load playbooks.'));
  }, []);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Response Playbooks</h1>
          <p className="subtitle">Predefined automated workflows triggered when incidents match a category</p>
        </div>
      </div>

      {error && <ErrorState message={error} />}
      {!error && !playbooks && <LoadingState />}
      {playbooks && playbooks.length === 0 && <EmptyState label="No playbooks configured." />}

      <div className="grid grid-2">
        {playbooks?.map((pb) => (
          <div key={pb.id} className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
              <div>
                <div style={{ fontWeight: 650, fontSize: 15 }}>{pb.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', textTransform: 'capitalize', marginTop: 2 }}>
                  Triggers on: {pb.triggerCategory.replace(/_/g, ' ')}
                </div>
              </div>
              <span
                className="badge"
                style={{
                  background: pb.autoExecute ? 'rgba(34,197,94,0.15)' : 'rgba(100,116,139,0.15)',
                  color: pb.autoExecute ? 'var(--status-good)' : 'var(--text-secondary)',
                }}
              >
                {pb.autoExecute ? 'Auto-execute' : 'Manual approval'}
              </span>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 0 }}>{pb.description}</p>
            <ol style={{ paddingLeft: 18, margin: 0, fontSize: 13, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {pb.steps.map((step, idx) => (
                <li key={idx}>
                  {step.description}
                  <span style={{ color: 'var(--text-muted)', fontSize: 11 }}> [{step.type.replace(/_/g, ' ')}]</span>
                </li>
              ))}
            </ol>
          </div>
        ))}
      </div>
    </div>
  );
}
