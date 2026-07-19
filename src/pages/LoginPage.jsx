import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import { resendVerification } from '../api/auth';

function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const justVerified = searchParams.get('verified') === '1';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [unverified, setUnverified] = useState(false);
  const [resent, setResent] = useState(false);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setUnverified(false);
    setBusy(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      if (err.code === 'EMAIL_UNVERIFIED') setUnverified(true);
      else setError(err.message || 'Login failed');
    } finally {
      setBusy(false);
    }
  }

  async function handleResend() {
    setResent(true);
    try { await resendVerification(email); } catch { /* generic 200 anyway */ }
  }

  return (
    <section className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h1 className="auth-card__title">Log in</h1>
        {justVerified && <p className="auth-card__success">Email verified — you can log in now.</p>}
        {error && <p className="auth-card__error">{error}</p>}
        {unverified && (
          <div className="auth-card__notice">
            <p>Please verify your email before logging in.</p>
            <button type="button" className="button button--ghost" onClick={handleResend} disabled={resent}>
              {resent ? 'Verification email resent' : 'Resend verification email'}
            </button>
          </div>
        )}
        <label className="auth-card__field">
          Email
          <input
            type="email"
            name="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>
        <label className="auth-card__field">
          Password
          <input
            type="password"
            name="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>
        <button type="submit" className="button button--primary" disabled={busy}>
          {busy ? 'Logging in…' : 'Log in'}
        </button>
        <p className="auth-card__footer">
          Don&apos;t have an account? <Link to="/register">Register</Link>
        </p>
      </form>
    </section>
  );
}

export default LoginPage;
