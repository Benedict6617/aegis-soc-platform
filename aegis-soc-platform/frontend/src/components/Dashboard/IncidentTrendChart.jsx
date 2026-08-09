import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

export default function IncidentTrendChart({ incidentsPerDay = {}, alertsPerDay = {} }) {
  const days = [...new Set([...Object.keys(incidentsPerDay), ...Object.keys(alertsPerDay)])].sort();
  const data = days.map((day) => ({
    day: day.slice(5),
    incidents: incidentsPerDay[day] || 0,
    alerts: alertsPerDay[day] || 0,
  }));

  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
        <defs>
          <linearGradient id="colorAlerts" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.35} />
            <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="colorIncidents" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.35} />
            <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#223052" vertical={false} />
        <XAxis dataKey="day" tick={{ fill: '#94a3c4', fontSize: 11 }} axisLine={{ stroke: '#223052' }} tickLine={false} />
        <YAxis tick={{ fill: '#94a3c4', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
        <Tooltip
          contentStyle={{ background: '#141d33', border: '1px solid #223052', borderRadius: 8, fontSize: 12.5 }}
          labelStyle={{ color: '#e6ebf5' }}
        />
        <Area type="monotone" dataKey="alerts" stroke="#0ea5e9" fill="url(#colorAlerts)" strokeWidth={2} name="Alerts" />
        <Area type="monotone" dataKey="incidents" stroke="#ef4444" fill="url(#colorIncidents)" strokeWidth={2} name="Incidents" />
      </AreaChart>
    </ResponsiveContainer>
  );
}
