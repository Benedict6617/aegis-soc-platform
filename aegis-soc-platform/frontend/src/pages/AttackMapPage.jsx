import { useEffect, useState } from 'react';
import { threatIntelApi } from '../api/endpoints';
import AttackMap from '../components/AttackMap/AttackMap';
import { LoadingState, ErrorState } from '../components/common/States';

export default function AttackMapPage() {
  const [indicators, setIndicators] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    threatIntelApi
      .map()
      .then((res) => setIndicators(res.data.data))
      .catch(() => setError('Failed to load threat map data.'));
  }, []);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Attack Map</h1>
          <p className="subtitle">Live visualization of active threat sources targeting your infrastructure</p>
        </div>
      </div>

      <div className="card">
        {error && <ErrorState message={error} />}
        {!error && !indicators && <LoadingState label="Plotting active threat indicators..." />}
        {indicators && <AttackMap indicators={indicators} />}
      </div>

      {indicators && (
        <div className="card" style={{ marginTop: 20 }}>
          <div className="card-title">Active Threat Indicators ({indicators.length})</div>
          <table>
            <thead>
              <tr>
                <th>Indicator</th>
                <th>Type</th>
                <th>Threat Actor</th>
                <th>Origin</th>
                <th>Last Seen</th>
              </tr>
            </thead>
            <tbody>
              {indicators.map((i) => (
                <tr key={i.id}>
                  <td className="mono">{i.indicatorValue}</td>
                  <td style={{ textTransform: 'capitalize', color: 'var(--text-secondary)' }}>{i.indicatorType}</td>
                  <td>{i.threatActor || 'Unattributed'}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>{i.countryOfOrigin || 'Unknown'}</td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: 12.5 }}>
                    {i.lastSeenAt ? new Date(i.lastSeenAt).toLocaleDateString() : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
