import { Link } from 'react-router-dom';

function LoginPage() {
  return (
    <section className="auth-page">
      <form className="auth-card">
        <h1 className="auth-card__title">Log in</h1>
        <label className="auth-card__field">
          Username
          <input type="text" name="username" autoComplete="username" />
        </label>
        <label className="auth-card__field">
          Password
          <input type="password" name="password" autoComplete="current-password" />
        </label>
        <button type="submit" className="button button--primary">Log in</button>
        <p className="auth-card__footer">
          Don't have an account? <Link to="/register">Register</Link>
        </p>
      </form>
    </section>
  );
}

export default LoginPage;
