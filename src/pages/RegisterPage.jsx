import { useState } from 'react';
import { Link } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import { resendVerification } from '../api/auth';

function RegisterPage() {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [sentTo, setSentTo] = useState(null);
  const [resent, setResent] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }
    setBusy(true);
    try {
      await register(email, password, name);
      setSentTo(email);
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setBusy(false);
    }
  }

  async function handleResend() {
    setResent(true);
    try { await resendVerification(sentTo); } catch { /* generic 200 anyway */ }
  }

  if (sentTo) {
    return (
      <section className="auth-page">
        <div className="auth-card">
          <h1 className="auth-card__title">Check your email</h1>
          <p className="auth-card__message">
            We sent a verification link to <strong>{sentTo}</strong>. Click it to activate your
            account, then log in.
          </p>
          <button
            type="button"
            className="button button--ghost"
            onClick={handleResend}
            disabled={resent}
          >
            {resent ? 'Verification email resent' : 'Resend email'}
          </button>
          <p className="auth-card__footer">
            <Link to="/login">Back to log in</Link>
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h1 className="auth-card__title">Create an account</h1>
        {error && <p className="auth-card__error">{error}</p>}
        <label className="auth-card__field">
          Name
          <input
            type="text"
            name="name"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </label>
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
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>
        <label className="auth-card__field">
          Confirm password
          <input
            type="password"
            name="confirmPassword"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
          />
        </label>
        <button type="submit" className="button button--primary" disabled={busy}>
          {busy ? 'Creating…' : 'Register'}
        </button>
        <p className="auth-card__footer">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </form>
    </section>
  );
}

export default RegisterPage;
