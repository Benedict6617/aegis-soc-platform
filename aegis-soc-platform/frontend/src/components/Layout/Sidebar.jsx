import { NavLink } from 'react-router-dom';

const NAV_ITEMS = [
  { to: '/', label: 'Overview', icon: '\u25C8', end: true },
  { to: '/incidents', label: 'Incidents', icon: '\u26A0' },
  { to: '/alerts', label: 'Alerts', icon: '\u2732' },
  { to: '/attack-map', label: 'Attack Map', icon: '\u25C9' },
  { to: '/assets', label: 'Assets', icon: '\u2637' },
  { to: '/vulnerabilities', label: 'Vulnerabilities', icon: '\u26E1' },
  { to: '/threat-intel', label: 'Threat Intel', icon: '\u2691' },
  { to: '/compliance', label: 'Compliance', icon: '\u2611' },
  { to: '/audit-logs', label: 'Audit Logs', icon: '\u2637' },
  { to: '/playbooks', label: 'Playbooks', icon: '\u25A6' },
];

export default function Sidebar() {
  return (
    <aside
      style={{
        background: 'var(--bg-secondary)',
        borderRight: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        padding: '18px 12px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 10px 22px' }}>
        <div
          style={{
            width: 30,
            height: 30,
            borderRadius: 8,
            background: 'linear-gradient(135deg, #0ea5e9, #0369a1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 800,
            fontSize: 14,
            color: '#04141f',
          }}
        >
          A
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 15, lineHeight: 1.1 }}>Aegis SOC</div>
          <div style={{ fontSize: 10.5, color: 'var(--text-muted)', letterSpacing: '0.04em' }}>SECURITY OPERATIONS</div>
        </div>
      </div>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '9px 12px',
              borderRadius: 8,
              fontSize: 13.5,
              fontWeight: isActive ? 600 : 500,
              color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
              background: isActive ? 'var(--bg-hover)' : 'transparent',
            })}
          >
            <span style={{ width: 16, textAlign: 'center', opacity: 0.85 }}>{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div
        style={{
          fontSize: 11,
          color: 'var(--text-muted)',
          padding: '10px 12px',
          borderTop: '1px solid var(--border-color)',
        }}
      >
        v1.0.0 &middot; Small Business Edition
      </div>
    </aside>
  );
}
