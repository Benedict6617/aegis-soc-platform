import client from './client';

export const authApi = {
  login: (email, password) => client.post('/auth/login', { email, password }),
  me: () => client.get('/auth/me'),
  logout: () => client.post('/auth/logout'),
};

export const dashboardApi = {
  summary: () => client.get('/dashboard/summary'),
  trends: (days = 14) => client.get(`/dashboard/trends?days=${days}`),
};

export const incidentsApi = {
  list: (params = {}) => client.get('/incidents', { params }),
  get: (id) => client.get(`/incidents/${id}`),
  assign: (id, analystId) => client.post(`/incidents/${id}/assign`, { analystId }),
  setStatus: (id, status, note) => client.post(`/incidents/${id}/status`, { status, note }),
  addNote: (id, note) => client.post(`/incidents/${id}/notes`, { note }),
  executePlaybook: (id) => client.post(`/incidents/${id}/execute-playbook`),
};

export const alertsApi = {
  list: (params = {}) => client.get('/alerts', { params }),
  ingest: (payload) => client.post('/alerts/ingest', payload),
};

export const assetsApi = {
  list: (params = {}) => client.get('/assets', { params }),
  get: (id) => client.get(`/assets/${id}`),
  quarantine: (id, reason, incidentId) => client.post(`/assets/${id}/quarantine`, { reason, incidentId }),
  release: (id, notes, incidentId) => client.post(`/assets/${id}/release`, { notes, incidentId }),
};

export const vulnerabilitiesApi = {
  list: (params = {}) => client.get('/vulnerabilities', { params }),
  update: (id, payload) => client.put(`/vulnerabilities/${id}`, payload),
};

export const threatIntelApi = {
  list: (params = {}) => client.get('/threat-intel', { params }),
  map: () => client.get('/threat-intel/map'),
};

export const complianceApi = {
  list: () => client.get('/compliance'),
  generate: (framework, periodStart, periodEnd) =>
    client.post('/compliance/generate', { framework, periodStart, periodEnd }),
};

export const auditApi = {
  list: (params = {}) => client.get('/audit-logs', { params }),
};

export const playbooksApi = {
  list: () => client.get('/playbooks'),
};

export const usersApi = {
  list: () => client.get('/users'),
};
