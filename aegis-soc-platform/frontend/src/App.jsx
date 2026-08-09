import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Sidebar from './components/Layout/Sidebar';
import Topbar from './components/Layout/Topbar';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Incidents from './pages/Incidents';
import IncidentDetail from './pages/IncidentDetail';
import Alerts from './pages/Alerts';
import Assets from './pages/Assets';
import Vulnerabilities from './pages/Vulnerabilities';
import AttackMapPage from './pages/AttackMapPage';
import ThreatIntelligence from './pages/ThreatIntelligence';
import Compliance from './pages/Compliance';
import AuditLogs from './pages/AuditLogs';
import Playbooks from './pages/Playbooks';

function AppShell({ children }) {
  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-content">
        <Topbar />
        <div className="page-body">{children}</div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <AppShell>
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/incidents" element={<Incidents />} />
                  <Route path="/incidents/:id" element={<IncidentDetail />} />
                  <Route path="/alerts" element={<Alerts />} />
                  <Route path="/assets" element={<Assets />} />
                  <Route path="/vulnerabilities" element={<Vulnerabilities />} />
                  <Route path="/attack-map" element={<AttackMapPage />} />
                  <Route path="/threat-intel" element={<ThreatIntelligence />} />
                  <Route path="/compliance" element={<Compliance />} />
                  <Route path="/audit-logs" element={<AuditLogs />} />
                  <Route path="/playbooks" element={<Playbooks />} />
                </Routes>
              </AppShell>
            </ProtectedRoute>
          }
        />
      </Routes>
    </AuthProvider>
  );
}
