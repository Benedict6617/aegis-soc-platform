import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { incidentsApi } from '../api/endpoints';
import { SeverityBadge, StatusBadge } from '../components/common/Badges';
import { LoadingState, ErrorState } from '../components/common/States';

const NEXT_STATUS = {
  open: ['investigating', 'closed'],
  investigating: ['contained', 'closed'],
  contained: ['eradicated', 'investigating'],
  eradicated: ['recovering'],
  recovering: ['closed'],
  closed: [],
};

export default function IncidentDetail() {
  const { id } = useParams();
  const [incident, setIncident] = useState(null);
  const [error, setError] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    incidentsApi
      .get(id)
      .then((res) => setIncident(res.data.data))
      .catch(() => setError('Failed to load incident.'));
  }, [id]);

  useEffect(load, [load]);

  const handleStatusChange = async (newStatus) => {
    setBusy(true);
    try {
      await incidentsApi.setStatus(id, newStatus);
      load();
    } finally {
      setBusy(false);
    }
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!note.trim()) return;
    setBusy(true);
    try {
      await incidentsApi.addNote(id, note.trim());
      setNote('');
      load();
    } finally {
      setBusy(false);
    }
  };

  const handleExecutePlaybook = async () => {
    setBusy(true);
    try {
      await incidentsApi.executePlaybook(id);
      load();
    } finally {
      setBusy(false);
    }
  };

  if (error) return <ErrorState message={error} />;
  if (!incident) return <LoadingState label="Loading incident details..." />;

  return (
    <div>
      <div className="page-header">
        <div>
          <Link to="/incidents" style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>
            &larr; Back to incidents
          </Link>
          <h1 style={{ marginTop: 6 }}>{incident.title}</h1>
          <p className="subtitle">
            <span className="mono">{incident.referenceCode}</span> &middot; Detected{' '}
            {new Date(incident.detectedAt).toLocaleString()}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <SeverityBadge severity={incident.severity} />
          <StatusBadge status={incident.status} />
        </div>
      </div>

      <div className="grid grid-3" style={{ marginBottom: 20 }}>
        <div className="stat-card">
          <div className="label">Risk Score</div>
          <div className="value">{incident.riskScore}/100</div>
        </div>
        <div className="stat-card">
          <div className="label">Affected Assets</div>
          <div className="value">{incident.affectedAssetCount}</div>
        </div>
        <div className="stat-card">
          <div className="label">Assigned Analyst</div>
          <div className="value" style={{ fontSize: 18 }}>
            {incident.assignedAnalyst?.fullName || 'Unassigned'}
          </div>
        </div>
      </div>

      <div className="grid grid-2" style={{ alignItems: 'start' }}>
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-title">Incident Timeline</div>
          <ul className="timeline">
            {incident.timeline?.map((event) => (
              <li key={event.id} className="timeline-item">
                <div className="meta">
                  {new Date(event.occurredAt).toLocaleString()} &middot; {event.actor} &middot;{' '}
                  <span style={{ textTransform: 'capitalize' }}>{event.eventType.replace(/_/g, ' ')}</span>
                </div>
                <div className="desc">{event.description}</div>
              </li>
            ))}
          </ul>

          <form onSubmit={handleAddNote} style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add an analyst note..."
              style={{ flex: 1 }}
            />
            <button className="btn" type="submit" disabled={busy}>
              Add note
            </button>
          </form>
        </div>

        <div>
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-title">Response Actions</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {(NEXT_STATUS[incident.status] || []).map((s) => (
                <button key={s} className="btn" disabled={busy} onClick={() => handleStatusChange(s)}>
                  Move to {s.replace(/_/g, ' ')}
                </button>
              ))}
              {incident.playbook && (
                <button className="btn btn-primary" disabled={busy} onClick={handleExecutePlaybook}>
                  Execute playbook: {incident.playbook.name}
                </button>
              )}
              {!incident.playbook && (
                <div style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>
                  No response playbook matched this incident category.
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <div className="card-title">Correlated Alerts ({incident.alerts?.length || 0})</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {incident.alerts?.map((alert) => (
                <div key={alert.id} style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{alert.ruleName}</span>
                    <SeverityBadge severity={alert.severity} />
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                    {alert.source.replace(/_/g, ' ')} &middot; {new Date(alert.detectedAt).toLocaleString()}
                  </div>
                  {alert.description && (
                    <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', marginTop: 4 }}>{alert.description}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {incident.summary && (
        <div className="card" style={{ marginTop: 20 }}>
          <div className="card-title">Automated Correlation Summary</div>
          <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>{incident.summary}</p>
        </div>
      )}
    </div>
  );
}
