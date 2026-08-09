import { useEffect, useState } from 'react';
import { auditApi } from '../api/endpoints';
import { LoadingState, EmptyState, ErrorState } from '../components/common/States';

export default function AuditLogs() {
  const [logs, setLogs] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    auditApi
      .list({ pageSize: 100 })
      .then((res) => setLogs(res.data.data))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load audit logs.'));
  }, []);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Audit Logs</h1>
          <p className="subtitle">Tamper-evident activity trail for authentication, incident, and configuration changes</p>
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {error && <ErrorState message={error} />}
        {!error && !logs && <LoadingState />}
        {logs && logs.length === 0 && <EmptyState label="No audit log entries yet." />}
        {logs && logs.length > 0 && (
          <table>
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Actor</th>
                <th>Action</th>
                <th>Entity</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => {
                let metadata = {};
                try {
                  metadata = JSON.parse(log.metadata || '{}');
                } catch {
                  metadata = {};
                }
                return (
                  <tr key={log.id}>
                    <td style={{ color: 'var(--text-secondary)', fontSize: 12.5 }}>
                      {new Date(log.occurredAt).toLocaleString()}
                    </td>
                    <td>{log.actorName || 'system'}</td>
                    <td className="mono">{log.action}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>
                      {log.entityType ? `${log.entityType}${log.entityId ? ` #${log.entityId.slice(0, 8)}` : ''}` : '—'}
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: 12, maxWidth: 320 }}>
                      {Object.keys(metadata).length > 0 ? JSON.stringify(metadata) : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
