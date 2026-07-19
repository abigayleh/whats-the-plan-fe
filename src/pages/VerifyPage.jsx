import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { verifyEmail } from '../api/auth';

// Landing page for the emailed verification link. Calls the API with the token, then bounces
// to login on success. Verification is idempotent, so a re-run (e.g. StrictMode) is harmless.
function VerifyPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('verifying'); // verifying | success | error
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    const token = searchParams.get('token');
    if (!token) { setStatus('error'); return; }
    (async () => {
      try {
        await verifyEmail(token);
        setStatus('success');
        setTimeout(() => navigate('/login?verified=1'), 1500);
      } catch {
        setStatus('error');
      }
    })();
  }, [searchParams, navigate]);

  return (
    <section className="auth-page">
      <div className="auth-card">
        {status === 'verifying' && <h1 className="auth-card__title">Verifying your email…</h1>}
        {status === 'success' && (
          <>
            <h1 className="auth-card__title">Email verified</h1>
            <p className="auth-card__message">Taking you to the log in page…</p>
          </>
        )}
        {status === 'error' && (
          <>
            <h1 className="auth-card__title">Link expired or invalid</h1>
            <p className="auth-card__message">
              This verification link didn&apos;t work. Log in to request a new one.
            </p>
            <p className="auth-card__footer"><Link to="/login">Go to log in</Link></p>
          </>
        )}
      </div>
    </section>
  );
}

export default VerifyPage;
