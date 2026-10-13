import { render, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// Render a component inside a router (most screens use Link / useNavigate). Pass `route`
// to set the initial URL. Mock app providers (useAppData, useAuth) and the socket per-test.
export function renderWithRouter(ui, { route = '/', ...options } = {}) {
  return render(ui, {
    wrapper: ({ children }) => <MemoryRouter initialEntries={[route]}>{children}</MemoryRouter>,
    ...options,
  });
}

// Flips the tab between hidden and visible, as switching tabs or locking the screen does.
export function setVisibility(state) {
  act(() => {
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => state });
    document.dispatchEvent(new Event('visibilitychange'));
  });
}

export {
  render, screen, within, waitFor, fireEvent, act, cleanup,
} from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';