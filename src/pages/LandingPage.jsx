import { SITE_NAME, SITE_DESCRIPTION, FEATURES } from '../constants/site';

// Rendered to static HTML at build time by scripts/prerender.js, so it must stay a pure
// component: no hooks, no browser APIs, and plain anchors rather than <Link> (which needs
// a router context the prerenderer doesn't have).
function LandingPage() {
  return (
    <main className="landing">
      <section className="landing-hero">
        <h1 className="landing-hero__title">{SITE_NAME}</h1>
        <p className="landing-hero__lede">{SITE_DESCRIPTION}</p>
        <div className="landing-hero__actions">
          <a className="button button--primary" href="/demo">Try the live demo</a>
          <a className="button button--ghost" href="/register">Create an account</a>
        </div>
        <p className="landing-hero__note">
          Already have an account? <a href="/login">Log in</a>
        </p>
      </section>

      <section className="landing-features">
        <h2 className="landing-features__title">What you get</h2>
        <ul className="landing-features__list">
          {FEATURES.map(({ name, blurb }) => (
            <li key={name} className="landing-feature">
              <h3 className="landing-feature__name">{name}</h3>
              <p className="landing-feature__blurb">{blurb}</p>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}

export default LandingPage;