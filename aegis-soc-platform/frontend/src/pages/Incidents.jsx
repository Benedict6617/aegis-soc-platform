import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { incidentsApi } from '../api/endpoints';
import { SeverityBadge, StatusBadge } from '../components/common/Badges';
import { LoadingState, EmptyState, ErrorState } from '../components/common/States';

const STATUS_OPTIONS = ['open', 'investigating', 'contained', 'eradicated', 'recovering', 'closed'];
const SEVERITY_OPTIONS = ['critical', 'high', 'medium', 'low'];

export default function Incidents() {
  const [incidents, setIncidents] = useState(null);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [severity, setSeverity] = useState('');

  const load = () => {
    incidentsApi
      .list({ status: status || undefined, severity: severity || undefined, pageSize: 50 })
      .then((res) => setIncidents(res.data.data))
      .catch(() => setError('Failed to load incidents.'));
  };

  useEffect(load, [status, severity]);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Incidents</h1>
          <p className="subtitle">Correlated, AI-prioritized security incidents across your environment</p>
        </div>
      </div>

      <div className="filter-bar">
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s.replace(/_/g, ' ')}
            </option>
          ))}
        </select>
        <select value={severity} onChange={(e) => setSeverity(e.target.value)}>
          <option value="">All severities</option>
          {SEVERITY_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {error && <ErrorState message={error} />}
        {!error && !incidents && <LoadingState />}
        {incidents && incidents.length === 0 && <EmptyState label="No incidents match these filters." />}
        {incidents && incidents.length > 0 && (
          <table>
            <thead>
              <tr>
                <th>Reference</th>
                <th>Title</th>
                <th>Category</th>
                <th>Severity</th>
                <th>Risk</th>
                <th>Assigned</th>
                <th>Status</th>
                <th>Detected</th>
              </tr>
            </thead>
            <tbody>
              {incidents.map((incident) => (
                <tr key={incident.id} className="clickable">
                  <td>
                    <Link to={`/incidents/${incident.id}`} className="mono" style={{ color: 'var(--accent-blue)' }}>
                      {incident.referenceCode}
                    </Link>
                  </td>
                  <td style={{ maxWidth: 300, textTransform: 'capitalize' }}>{incident.title}</td>
                  <td style={{ textTransform: 'capitalize', color: 'var(--text-secondary)' }}>
                    {incident.category.replace(/_/g, ' ')}
                  </td>
                  <td>
                    <SeverityBadge severity={incident.severity} />
                  </td>
                  <td style={{ fontVariantNumeric: 'tabular-nums' }}>{incident.riskScore}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>{incident.assignedAnalyst?.fullName || 'Unassigned'}</td>
                  <td>
                    <StatusBadge status={incident.status} />
                  </td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: 12.5 }}>
                    {new Date(incident.detectedAt).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
