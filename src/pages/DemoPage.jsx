import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

// The portfolio entry point: /demo signs the visitor into the shared demo account and drops
// them on the calendar. There's nothing to click — the link itself is the whole flow.
function DemoPage() {
  const { demoLogin } = useAuth();
  const navigate = useNavigate();
  const [failed, setFailed] = useState(false);
  // StrictMode runs effects twice in development. A second sign-in would be harmless, but
  // it would spend a request against the rate limit for nothing.
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    demoLogin()
      .then(() => navigate('/', { replace: true }))
      .catch(() => setFailed(true));
  }, [demoLogin, navigate]);

  return (
    <section className="auth-page">
      <div className="auth-card">
        <h1 className="auth-card__title">{failed ? 'Demo unavailable' : 'Opening the demo…'}</h1>
        {failed ? (
          <>
            <p className="auth-card__error">The demo couldn’t be opened just now. Try again in a moment.</p>
            <Link to="/login" className="button button--ghost">Go to log in</Link>
          </>
        ) : (
          <p className="auth-card__message">Signing you in — one moment.</p>
        )}
      </div>
    </section>
  );
}

export default DemoPage;