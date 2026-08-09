import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { dashboardApi } from '../api/endpoints';
import StatCard from '../components/Dashboard/StatCard';
import IncidentTrendChart from '../components/Dashboard/IncidentTrendChart';
import BreakdownChart from '../components/Dashboard/BreakdownChart';
import { SeverityBadge, StatusBadge } from '../components/common/Badges';
import { LoadingState, ErrorState } from '../components/common/States';

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [trends, setTrends] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([dashboardApi.summary(), dashboardApi.trends(14)])
      .then(([summaryRes, trendsRes]) => {
        setSummary(summaryRes.data.data);
        setTrends(trendsRes.data.data);
      })
      .catch(() => setError('Failed to load dashboard data.'));
  }, []);

  if (error) return <ErrorState message={error} />;
  if (!summary || !trends) return <LoadingState label="Loading SOC overview..." />;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Security Operations Overview</h1>
          <p className="subtitle">Real-time posture across servers, endpoints, cloud, and network infrastructure</p>
        </div>
      </div>

      <div className="grid grid-4" style={{ marginBottom: 20 }}>
        <StatCard
          label="Open Incidents"
          value={summary.openIncidents}
          delta={`${summary.criticalIncidents} critical`}
          tone={summary.criticalIncidents > 0 ? 'critical' : 'neutral'}
        />
        <StatCard label="Alerts (24h)" value={summary.alerts24h} delta={`${summary.incidents24h} became incidents`} />
        <StatCard
          label="Compromised / Quarantined Assets"
          value={`${summary.compromisedAssets} / ${summary.quarantinedAssets}`}
          delta={`of ${summary.totalAssets} monitored assets`}
          tone={summary.compromisedAssets > 0 ? 'high' : 'good'}
        />
        <StatCard
          label="Open Vulnerabilities"
          value={summary.openVulnerabilities}
          delta={`${summary.criticalVulnerabilities} critical severity`}
          tone={summary.criticalVulnerabilities > 0 ? 'high' : 'neutral'}
        />
      </div>

      <div className="grid grid-2" style={{ marginBottom: 20, alignItems: 'stretch' }}>
        <div className="card">
          <div className="card-title">Alert &amp; Incident Volume (14 days)</div>
          <IncidentTrendChart incidentsPerDay={trends.incidentsPerDay} alertsPerDay={trends.alertsPerDay} />
        </div>
        <div className="card">
          <div className="card-title">Open Incidents by Severity</div>
          <BreakdownChart breakdown={trends.severityBreakdown} colorBy="severity" />
        </div>
      </div>

      <div className="grid grid-2" style={{ marginBottom: 20, alignItems: 'stretch' }}>
        <div className="card">
          <div className="card-title">Alert Sources (14 days)</div>
          <BreakdownChart breakdown={trends.sourceBreakdown} colorBy="source" />
        </div>
        <div className="card">
          <div className="card-title">Incidents by Category</div>
          <BreakdownChart breakdown={trends.categoryBreakdown} colorBy="category" />
        </div>
      </div>

      <div className="card">
        <div className="card-title">Recent Incidents</div>
        <table>
          <thead>
            <tr>
              <th>Reference</th>
              <th>Title</th>
              <th>Severity</th>
              <th>Risk Score</th>
              <th>Status</th>
              <th>Detected</th>
            </tr>
          </thead>
          <tbody>
            {summary.recentIncidents.map((incident) => (
              <tr key={incident.id} className="clickable">
                <td>
                  <Link to={`/incidents/${incident.id}`} className="mono" style={{ color: 'var(--accent-blue)' }}>
                    {incident.referenceCode}
                  </Link>
                </td>
                <td style={{ maxWidth: 320, textTransform: 'capitalize' }}>{incident.title}</td>
                <td>
                  <SeverityBadge severity={incident.severity} />
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div className="risk-bar-track" style={{ width: 60 }}>
                      <div
                        className="risk-bar-fill"
                        style={{
                          width: `${incident.riskScore}%`,
                          background:
                            incident.riskScore >= 85 ? 'var(--severity-critical)' : incident.riskScore >= 65 ? 'var(--severity-high)' : 'var(--severity-medium)',
                        }}
                      />
                    </div>
                    <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{incident.riskScore}</span>
                  </div>
                </td>
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
      </div>
    </div>
  );
}
