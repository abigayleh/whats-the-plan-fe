import {
  describe, it, expect, vi, beforeEach,
} from 'vitest';
import { Routes, Route, Outlet } from 'react-router-dom';
import { act } from 'react';
import {
  renderWithRouter, screen, userEvent, waitFor,
} from '../../test/utils';
import PageEditor from './PageEditor';
import * as pagesApi from '../../api/pages';
import { socket } from '../../socket/socketClient';

// The document is TipTap-heavy; stub it so we can test the surrounding editor chrome.
vi.mock('./PageDocument', () => ({
  default: ({ editable }) => <div data-testid="page-document" data-editable={String(editable)} />,
}));
vi.mock('../../api/pages', () => ({
  get: vi.fn(), update: vi.fn(), remove: vi.fn(), reorder: vi.fn(), list: vi.fn(), create: vi.fn(),
}));
vi.mock('../../socket/socketClient', () => ({
  socket: { on: vi.fn(), off: vi.fn(), emit: vi.fn() },
}));

const contextPages = [
  {
    id: 'p0', title: 'Parent', parentId: null, groupId: null, position: 0,
  },
  {
    id: 'p1', title: 'Child', parentId: 'p0', groupId: null, position: 0,
  },
];

function renderEditor({ canManagePage = () => true, deletePage = vi.fn().mockResolvedValue(undefined) } = {}) {
  const ctx = {
    pages: contextPages,
    canManagePage,
    saveContent: vi.fn().mockResolvedValue(undefined),
    updatePage: vi.fn().mockResolvedValue(undefined),
    deletePage,
  };
  renderWithRouter(
    <Routes>
      <Route element={<Outlet context={ctx} />}>
        <Route path="/pages/:pageId" element={<PageEditor />} />
      </Route>
    </Routes>,
    { route: '/pages/p1' },
  );
  return ctx;
}

describe('PageEditor', () => {
  beforeEach(() => {
    pagesApi.get.mockResolvedValue({
      id: 'p1', title: 'Child', content: null, icon: null, groupId: null, parentId: 'p0',
    });
  });

  it('shows a loading state, then the loaded page title and breadcrumb', async () => {
    renderEditor();
    expect(screen.getByText('Loading…')).toBeInTheDocument();
    expect(await screen.findByDisplayValue('Child')).toBeInTheDocument();
    // ancestor "Parent" appears as a breadcrumb link
    expect(screen.getByRole('link', { name: 'Parent' })).toHaveAttribute('href', '/pages/p0');
    expect(screen.getByTestId('page-document')).toHaveAttribute('data-editable', 'true');
  });

  it('shows an unavailable message when the fetch fails', async () => {
    pagesApi.get.mockRejectedValueOnce(new Error('gone'));
    renderEditor();
    expect(await screen.findByText('This page is unavailable.')).toBeInTheDocument();
  });

  it('opens the delete confirmation dialog', async () => {
    const user = userEvent.setup();
    renderEditor();
    await screen.findByDisplayValue('Child');
    await user.click(screen.getByRole('button', { name: 'Delete page' }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Delete this page? Its subpages move up a level.')).toBeInTheDocument();
  });

  it('loads an edit made elsewhere straight in when nothing is being typed', async () => {
    renderEditor();
    await screen.findByDisplayValue('Child');
    pagesApi.get.mockResolvedValue({
      id: 'p1', title: 'Renamed elsewhere', content: null, icon: null, groupId: null, parentId: 'p0',
    });
    const handler = socket.on.mock.calls.find(([evt]) => evt === 'page:updated')[1];
    act(() => handler({ id: 'p1' }));
    expect(await screen.findByDisplayValue('Renamed elsewhere')).toBeInTheDocument();
    expect(screen.queryByText(/changed elsewhere/)).not.toBeInTheDocument();
  });

  it('nudges instead of reloading when the edit would land under the caret', async () => {
    const user = userEvent.setup();
    renderEditor();
    await user.type(await screen.findByDisplayValue('Child'), '!');
    const handler = socket.on.mock.calls.find(([evt]) => evt === 'page:updated')[1];
    act(() => handler({ id: 'p1' }));
    expect(await screen.findByText(/changed elsewhere/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reload' })).toBeInTheDocument();
  });

  it('hides management controls and disables the title when read-only', async () => {
    renderEditor({ canManagePage: () => false });
    expect(await screen.findByDisplayValue('Child')).toBeDisabled();
    expect(screen.queryByRole('button', { name: 'Delete page' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Move to…' })).not.toBeInTheDocument();
    expect(screen.getByTestId('page-document')).toHaveAttribute('data-editable', 'false');
  });

  it('deletes the page and navigates away on confirm', async () => {
    const deletePage = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderEditor({ deletePage });
    await screen.findByDisplayValue('Child');
    await user.click(screen.getByRole('button', { name: 'Delete page' }));
    await user.click(screen.getByRole('button', { name: 'Delete' }));
    await waitFor(() => expect(deletePage).toHaveBeenCalledWith('p1'));
  });
});