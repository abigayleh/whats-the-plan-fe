import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// Render a component inside a router (most screens use Link / useNavigate). Pass `route`
// to set the initial URL. Mock app providers (useAppData, useAuth) and the socket per-test.
export function renderWithRouter(ui, { route = '/', ...options } = {}) {
  return render(ui, {
    wrapper: ({ children }) => <MemoryRouter initialEntries={[route]}>{children}</MemoryRouter>,
    ...options,
  });
}

export {
  render, screen, within, waitFor, fireEvent, act, cleanup,
} from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';