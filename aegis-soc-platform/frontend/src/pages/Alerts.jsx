import { useEffect, useState } from 'react';
import { alertsApi } from '../api/endpoints';
import { SeverityBadge } from '../components/common/Badges';
import { LoadingState, EmptyState, ErrorState } from '../components/common/States';

const SOURCE_OPTIONS = ['siem', 'edr', 'firewall', 'ids_ips', 'vulnerability_scanner', 'identity_provider', 'cloud_security', 'threat_intel'];

export default function Alerts() {
  const [alerts, setAlerts] = useState(null);
  const [error, setError] = useState('');
  const [source, setSource] = useState('');
  const [severity, setSeverity] = useState('');

  useEffect(() => {
    alertsApi
      .list({ source: source || undefined, severity: severity || undefined, pageSize: 50 })
      .then((res) => setAlerts(res.data.data))
      .catch(() => setError('Failed to load alerts.'));
  }, [source, severity]);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Alerts</h1>
          <p className="subtitle">Normalized events from SIEM, EDR, firewalls, identity, and cloud security tooling</p>
        </div>
      </div>

      <div className="filter-bar">
        <select value={source} onChange={(e) => setSource(e.target.value)}>
          <option value="">All sources</option>
          {SOURCE_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s.replace(/_/g, ' ')}
            </option>
          ))}
        </select>
        <select value={severity} onChange={(e) => setSeverity(e.target.value)}>
          <option value="">All severities</option>
          {['critical', 'high', 'medium', 'low', 'informational'].map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {error && <ErrorState message={error} />}
        {!error && !alerts && <LoadingState />}
        {alerts && alerts.length === 0 && <EmptyState label="No alerts match these filters." />}
        {alerts && alerts.length > 0 && (
          <table>
            <thead>
              <tr>
                <th>Rule</th>
                <th>Source</th>
                <th>Severity</th>
                <th>Asset</th>
                <th>Source IP</th>
                <th>Status</th>
                <th>Detected</th>
              </tr>
            </thead>
            <tbody>
              {alerts.map((alert) => (
                <tr key={alert.id}>
                  <td style={{ maxWidth: 280 }}>{alert.ruleName}</td>
                  <td style={{ textTransform: 'capitalize', color: 'var(--text-secondary)' }}>
                    {alert.source.replace(/_/g, ' ')}
                  </td>
                  <td>
                    <SeverityBadge severity={alert.severity} />
                  </td>
                  <td style={{ color: 'var(--text-secondary)' }}>{alert.asset?.hostname || '—'}</td>
                  <td className="mono">{alert.sourceIp || '—'}</td>
                  <td style={{ textTransform: 'capitalize', color: 'var(--text-secondary)' }}>{alert.status}</td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: 12.5 }}>
                    {new Date(alert.detectedAt).toLocaleString()}
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
