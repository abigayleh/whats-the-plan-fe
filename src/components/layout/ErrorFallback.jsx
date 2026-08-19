// Shown when a render throws past every provider: the tree is gone, so all we can offer
// is a reload.
function ErrorFallback() {
  return (
    <div className="error-fallback">
      <h1>Something went wrong</h1>
      <p>We hit an unexpected error and the report is on its way to us.</p>
      <button type="button" className="button button--primary" onClick={() => window.location.reload()}>
        Reload the page
      </button>
    </div>
  );
}

export default ErrorFallback;
