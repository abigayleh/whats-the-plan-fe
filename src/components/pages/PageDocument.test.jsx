import {
  describe, it, expect, vi,
} from 'vitest';
import {
  renderWithRouter, screen, waitFor,
} from '../../test/utils';
import PageDocument from './PageDocument';

// A document holding a single page-link chip pointing at `pageId`.
const linkDoc = (pageId) => ({
  type: 'doc',
  content: [{ type: 'paragraph', content: [{ type: 'pageLink', attrs: { pageId } }] }],
});

describe('PageDocument', () => {
  it('renders the editor content region', async () => {
    const { container } = renderWithRouter(
      <PageDocument content="" editable={false} onChange={vi.fn()} pages={[]} scopePages={[]} />,
    );
    await waitFor(() => expect(container.querySelector('.page-doc')).toBeInTheDocument());
  });

  it('resolves a live page-link chip to the current page title', async () => {
    renderWithRouter(
      <PageDocument
        content={linkDoc('p1')}
        editable={false}
        onChange={vi.fn()}
        pages={[{ id: 'p1', title: 'Live Page' }]}
        scopePages={[]}
      />,
    );
    expect(await screen.findByText('Live Page')).toBeInTheDocument();
  });

  it('degrades a link to a removed page into a "Deleted page" chip', async () => {
    renderWithRouter(
      <PageDocument content={linkDoc('gone')} editable={false} onChange={vi.fn()} pages={[]} scopePages={[]} />,
    );
    expect(await screen.findByText('Deleted page')).toBeInTheDocument();
  });

  it('omits the table toolbar in read-only mode', async () => {
    const { container } = renderWithRouter(
      <PageDocument content="" editable={false} onChange={vi.fn()} pages={[]} scopePages={[]} />,
    );
    await waitFor(() => expect(container.querySelector('.page-doc')).toBeInTheDocument());
    expect(container.querySelector('.page-doc__table-toolbar')).not.toBeInTheDocument();
  });
});