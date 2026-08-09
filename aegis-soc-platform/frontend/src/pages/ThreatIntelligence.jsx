import { useEffect, useState } from 'react';
import { threatIntelApi } from '../api/endpoints';
import { SeverityBadge } from '../components/common/Badges';
import { LoadingState, EmptyState, ErrorState } from '../components/common/States';

export default function ThreatIntelligence() {
  const [indicators, setIndicators] = useState(null);
  const [error, setError] = useState('');
  const [severity, setSeverity] = useState('');

  useEffect(() => {
    threatIntelApi
      .list({ severity: severity || undefined })
      .then((res) => setIndicators(res.data.data))
      .catch(() => setError('Failed to load threat intelligence.'));
  }, [severity]);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Threat Intelligence</h1>
          <p className="subtitle">Indicators of compromise ingested from integrated threat intelligence feeds</p>
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
      </div>

      <div className="card" style={{ padding: 0 }}>
        {error && <ErrorState message={error} />}
        {!error && !indicators && <LoadingState />}
        {indicators && indicators.length === 0 && <EmptyState label="No threat intelligence indicators match this filter." />}
        {indicators && indicators.length > 0 && (
          <table>
            <thead>
              <tr>
                <th>Indicator</th>
                <th>Type</th>
                <th>Severity</th>
                <th>Confidence</th>
                <th>Threat Actor</th>
                <th>Campaign</th>
                <th>Feed Source</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {indicators.map((i) => (
                <tr key={i.id}>
                  <td className="mono" style={{ maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {i.indicatorValue}
                  </td>
                  <td style={{ textTransform: 'capitalize', color: 'var(--text-secondary)' }}>{i.indicatorType}</td>
                  <td>
                    <SeverityBadge severity={i.severity} />
                  </td>
                  <td style={{ fontVariantNumeric: 'tabular-nums' }}>{i.confidence}%</td>
                  <td>{i.threatActor || 'Unattributed'}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>{i.campaign || '—'}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>{i.feedSource}</td>
                  <td>
                    <span style={{ color: i.isActive ? 'var(--status-good)' : 'var(--text-muted)', fontWeight: 600, fontSize: 12.5 }}>
                      {i.isActive ? '● Active' : '○ Inactive'}
                    </span>
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
