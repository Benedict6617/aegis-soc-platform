import { useEffect, useState } from 'react';
import { assetsApi } from '../api/endpoints';
import { StatusBadge } from '../components/common/Badges';
import { LoadingState, EmptyState, ErrorState } from '../components/common/States';

const TYPE_OPTIONS = ['server', 'endpoint', 'cloud_instance', 'firewall', 'application', 'network_device'];

const STATUS_TONE = {
  healthy: 'var(--status-good)',
  at_risk: 'var(--severity-medium)',
  compromised: 'var(--severity-critical)',
  quarantined: 'var(--severity-high)',
  decommissioned: 'var(--text-muted)',
};

export default function Assets() {
  const [assets, setAssets] = useState(null);
  const [error, setError] = useState('');
  const [assetType, setAssetType] = useState('');
  const [search, setSearch] = useState('');
  const [busyId, setBusyId] = useState(null);

  const load = () => {
    assetsApi
      .list({ assetType: assetType || undefined, search: search || undefined, pageSize: 50 })
      .then((res) => setAssets(res.data.data))
      .catch(() => setError('Failed to load assets.'));
  };

  useEffect(load, [assetType, search]);

  const handleQuarantine = async (assetId) => {
    const reason = window.prompt('Reason for quarantining this asset:');
    if (!reason) return;
    setBusyId(assetId);
    try {
      await assetsApi.quarantine(assetId, reason);
      load();
    } finally {
      setBusyId(null);
    }
  };

  const handleRelease = async (assetId) => {
    setBusyId(assetId);
    try {
      await assetsApi.release(assetId, 'Released via asset inventory.');
      load();
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Asset Inventory</h1>
          <p className="subtitle">Servers, endpoints, cloud infrastructure, firewalls, and applications under monitoring</p>
        </div>
      </div>

      <div className="filter-bar">
        <input placeholder="Search hostname or IP..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ width: 240 }} />
        <select value={assetType} onChange={(e) => setAssetType(e.target.value)}>
          <option value="">All asset types</option>
          {TYPE_OPTIONS.map((t) => (
            <option key={t} value={t}>
              {t.replace(/_/g, ' ')}
            </option>
          ))}
        </select>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {error && <ErrorState message={error} />}
        {!error && !assets && <LoadingState />}
        {assets && assets.length === 0 && <EmptyState label="No assets match these filters." />}
        {assets && assets.length > 0 && (
          <table>
            <thead>
              <tr>
                <th>Hostname</th>
                <th>Type</th>
                <th>IP Address</th>
                <th>Criticality</th>
                <th>Status</th>
                <th>Owner</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {assets.map((asset) => (
                <tr key={asset.id}>
                  <td style={{ fontWeight: 600 }}>{asset.hostname}</td>
                  <td style={{ textTransform: 'capitalize', color: 'var(--text-secondary)' }}>
                    {asset.assetType.replace(/_/g, ' ')}
                  </td>
                  <td className="mono">{asset.ipAddress || '—'}</td>
                  <td style={{ textTransform: 'capitalize', color: 'var(--text-secondary)' }}>{asset.criticality}</td>
                  <td>
                    <span style={{ color: STATUS_TONE[asset.status] || 'var(--text-secondary)', fontWeight: 600, fontSize: 13 }}>
                      ● {asset.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td style={{ color: 'var(--text-secondary)' }}>{asset.owner || '—'}</td>
                  <td style={{ textAlign: 'right' }}>
                    {asset.status === 'quarantined' ? (
                      <button className="btn" disabled={busyId === asset.id} onClick={() => handleRelease(asset.id)}>
                        Release
                      </button>
                    ) : (
                      <button className="btn btn-danger" disabled={busyId === asset.id} onClick={() => handleQuarantine(asset.id)}>
                        Quarantine
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
