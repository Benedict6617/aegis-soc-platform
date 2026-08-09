import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('marcus.ibe@nimbusretail.com');
  const [password, setPassword] = useState('AegisManager!2024');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'radial-gradient(circle at 20% 20%, #0f1d38 0%, #0b1220 60%)',
      }}
    >
      <div style={{ width: 380 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28, justifyContent: 'center' }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 9,
              background: 'linear-gradient(135deg, #0ea5e9, #0369a1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: 17,
              color: '#04141f',
            }}
          >
            A
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 18 }}>Aegis SOC</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', letterSpacing: '0.04em' }}>SECURITY OPERATIONS PLATFORM</div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: 12.5, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
              Work email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{ width: '100%' }}
            />
          </div>
          <div>
            <label style={{ fontSize: 12.5, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ width: '100%' }}
            />
          </div>

          {error && <div style={{ color: 'var(--severity-critical)', fontSize: 12.5 }}>{error}</div>}

          <button type="submit" className="btn btn-primary" disabled={submitting} style={{ justifyContent: 'center', marginTop: 4 }}>
            {submitting ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <div
          className="card"
          style={{ marginTop: 14, fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}
        >
          <strong style={{ color: 'var(--text-primary)' }}>Demo credentials</strong> (see README for the full list):
          <br />
          SOC Manager &mdash; marcus.ibe@nimbusretail.com / AegisManager!2024
          <br />
          Admin &mdash; dana.whitfield@nimbusretail.com / AegisAdmin!2024
        </div>
      </div>
    </div>
  );
}
