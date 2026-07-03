import { Link } from 'react-router-dom';

function RegisterPage() {
  return (
    <section className="auth-page">
      <form className="auth-card">
        <h1 className="auth-card__title">Create an account</h1>
        <label className="auth-card__field">
          Username
          <input type="text" name="username" autoComplete="username" />
        </label>
        <label className="auth-card__field">
          Password
          <input type="password" name="password" autoComplete="new-password" />
        </label>
        <label className="auth-card__field">
          Confirm password
          <input type="password" name="confirmPassword" autoComplete="new-password" />
        </label>
        <button type="submit" className="button button--primary">Register</button>
        <p className="auth-card__footer">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </form>
    </section>
  );
}

export default RegisterPage;
