import { useEffect, useState } from 'react';
import { vulnerabilitiesApi } from '../api/endpoints';
import { SeverityBadge } from '../components/common/Badges';
import { LoadingState, EmptyState, ErrorState } from '../components/common/States';

export default function Vulnerabilities() {
  const [vulns, setVulns] = useState(null);
  const [error, setError] = useState('');
  const [severity, setSeverity] = useState('');
  const [status, setStatus] = useState('');

  const load = () => {
    vulnerabilitiesApi
      .list({ severity: severity || undefined, status: status || undefined, pageSize: 50 })
      .then((res) => setVulns(res.data.data))
      .catch(() => setError('Failed to load vulnerabilities.'));
  };

  useEffect(load, [severity, status]);

  const markRemediated = async (id) => {
    await vulnerabilitiesApi.update(id, { status: 'remediated' });
    load();
  };

  const isOverdue = (v) => v.dueDate && new Date(v.dueDate) < new Date() && v.status !== 'remediated';

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Vulnerability Management</h1>
          <p className="subtitle">Findings from integrated vulnerability scanners across your asset inventory</p>
        </div>
      </div>

      <div className="filter-bar">
        <select value={severity} onChange={(e) => setSeverity(e.target.value)}>
          <option value="">All severities</option>
          {['critical', 'high', 'medium', 'low'].map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          {['open', 'in_progress', 'remediated', 'accepted_risk', 'false_positive'].map((s) => (
            <option key={s} value={s}>
              {s.replace(/_/g, ' ')}
            </option>
          ))}
        </select>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {error && <ErrorState message={error} />}
        {!error && !vulns && <LoadingState />}
        {vulns && vulns.length === 0 && <EmptyState label="No vulnerability findings match these filters." />}
        {vulns && vulns.length > 0 && (
          <table>
            <thead>
              <tr>
                <th>Finding</th>
                <th>CVE</th>
                <th>CVSS</th>
                <th>Severity</th>
                <th>Asset</th>
                <th>Status</th>
                <th>Due</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {vulns.map((v) => (
                <tr key={v.id}>
                  <td style={{ maxWidth: 280 }}>{v.title}</td>
                  <td className="mono">{v.cveId || '—'}</td>
                  <td style={{ fontVariantNumeric: 'tabular-nums' }}>{v.cvssScore?.toFixed(1)}</td>
                  <td>
                    <SeverityBadge severity={v.severity} />
                  </td>
                  <td style={{ color: 'var(--text-secondary)' }}>{v.asset?.hostname || '—'}</td>
                  <td style={{ textTransform: 'capitalize', color: 'var(--text-secondary)' }}>{v.status.replace(/_/g, ' ')}</td>
                  <td style={{ color: isOverdue(v) ? 'var(--severity-critical)' : 'var(--text-secondary)', fontSize: 12.5 }}>
                    {v.dueDate ? new Date(v.dueDate).toLocaleDateString() : '—'}
                    {isOverdue(v) && ' (overdue)'}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    {v.status !== 'remediated' && (
                      <button className="btn" onClick={() => markRemediated(v.id)}>
                        Mark remediated
                      </button>
                    )}
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
