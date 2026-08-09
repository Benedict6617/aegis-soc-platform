import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from 'recharts';

const SEVERITY_COLORS = {
  critical: '#ef4444',
  high: '#f97316',
  medium: '#eab308',
  low: '#22c55e',
  informational: '#64748b',
};

export default function BreakdownChart({ breakdown = {}, colorBy = 'severity' }) {
  const data = Object.entries(breakdown).map(([key, count]) => ({ key, count }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 20, left: 10, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#223052" horizontal={false} />
        <XAxis type="number" tick={{ fill: '#94a3c4', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
        <YAxis
          type="category"
          dataKey="key"
          tick={{ fill: '#e6ebf5', fontSize: 12 }}
          axisLine={false}
          tickLine={false}
          width={110}
          tickFormatter={(v) => v.replace(/_/g, ' ')}
        />
        <Tooltip
          contentStyle={{ background: '#141d33', border: '1px solid #223052', borderRadius: 8, fontSize: 12.5 }}
          cursor={{ fill: 'rgba(255,255,255,0.03)' }}
        />
        <Bar dataKey="count" radius={[0, 4, 4, 0]}>
          {data.map((entry) => (
            <Cell
              key={entry.key}
              fill={colorBy === 'severity' ? SEVERITY_COLORS[entry.key] || '#0ea5e9' : '#0ea5e9'}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
