import { useEffect, useState } from 'react';
import { complianceApi } from '../api/endpoints';
import { LoadingState, EmptyState, ErrorState } from '../components/common/States';

const FRAMEWORKS = ['SOC2', 'ISO27001', 'PCI_DSS', 'HIPAA', 'GDPR', 'NIST_CSF'];

function scoreColor(score) {
  if (score >= 90) return 'var(--status-good)';
  if (score >= 70) return 'var(--severity-medium)';
  return 'var(--severity-critical)';
}

export default function Compliance() {
  const [reports, setReports] = useState(null);
  const [error, setError] = useState('');
  const [framework, setFramework] = useState('SOC2');
  const [periodStart, setPeriodStart] = useState(() => new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10));
  const [periodEnd, setPeriodEnd] = useState(() => new Date().toISOString().slice(0, 10));
  const [generating, setGenerating] = useState(false);
  const [expanded, setExpanded] = useState(null);

  const load = () => {
    complianceApi
      .list()
      .then((res) => setReports(res.data.data))
      .catch(() => setError('Failed to load compliance reports.'));
  };

  useEffect(load, []);

  const handleGenerate = async (e) => {
    e.preventDefault();
    setGenerating(true);
    try {
      await complianceApi.generate(framework, periodStart, periodEnd);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate report.');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Compliance Reports</h1>
          <p className="subtitle">Evidence-backed reports for SOC 2, ISO 27001, PCI DSS, HIPAA, GDPR, and NIST CSF</p>
        </div>
      </div>

      <form onSubmit={handleGenerate} className="card" style={{ marginBottom: 20 }}>
        <div className="card-title">Generate New Report</div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div>
            <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 5 }}>Framework</label>
            <select value={framework} onChange={(e) => setFramework(e.target.value)}>
              {FRAMEWORKS.map((f) => (
                <option key={f} value={f}>
                  {f.replace('_', ' ')}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 5 }}>Period start</label>
            <input type="date" value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} />
          </div>
          <div>
            <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 5 }}>Period end</label>
            <input type="date" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} />
          </div>
          <button className="btn btn-primary" type="submit" disabled={generating}>
            {generating ? 'Generating...' : 'Generate report'}
          </button>
        </div>
      </form>

      {error && <ErrorState message={error} />}
      {!error && !reports && <LoadingState />}
      {reports && reports.length === 0 && <EmptyState label="No compliance reports generated yet." />}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {reports?.map((r) => {
          const findings = JSON.parse(r.findings || '[]');
          const isOpen = expanded === r.id;
          return (
            <div key={r.id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }} onClick={() => setExpanded(isOpen ? null : r.id)}>
                <div>
                  <div style={{ fontWeight: 650, fontSize: 15 }}>{r.title}</div>
                  <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', marginTop: 3 }}>
                    {r.periodStart} to {r.periodEnd} &middot; {r.controlsPassed}/{r.controlsTotal} controls passed
                  </div>
                </div>
                <div style={{ fontSize: 28, fontWeight: 700, color: scoreColor(r.overallScore) }}>{r.overallScore}%</div>
              </div>

              {isOpen && (
                <table style={{ marginTop: 16 }}>
                  <thead>
                    <tr>
                      <th>Control</th>
                      <th>Result</th>
                      <th>Detail</th>
                    </tr>
                  </thead>
                  <tbody>
                    {findings.map((f) => (
                      <tr key={f.controlId}>
                        <td>
                          <span className="mono">{f.controlId}</span> &mdash; {f.controlName}
                        </td>
                        <td>
                          <span style={{ color: f.passed ? 'var(--status-good)' : 'var(--severity-critical)', fontWeight: 600 }}>
                            {f.passed ? 'Pass' : 'Fail'}
                          </span>
                        </td>
                        <td style={{ color: 'var(--text-secondary)' }}>{f.detail}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
