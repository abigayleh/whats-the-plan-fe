import {
  describe, it, expect, vi,
} from 'vitest';
import {
  renderWithRouter, screen, waitFor, userEvent,
} from '../../test/utils';
import PageDocument from './PageDocument';
import * as attachmentsApi from '../../api/attachments';

vi.mock('../../api/attachments', () => ({
  objectUrl: vi.fn(),
  upload: vi.fn(),
}));

// A document holding a single page-link chip pointing at `pageId`.
const linkDoc = (pageId) => ({
  type: 'doc',
  content: [{ type: 'paragraph', content: [{ type: 'pageLink', attrs: { pageId } }] }],
});

// A document holding a single image reference, optionally at a saved width.
const refDoc = (width) => ({
  type: 'doc',
  content: [{
    type: 'paragraph',
    content: [{ type: 'image', attrs: { src: 'attachment:a1', width } }],
  }],
});

// A document holding a single image, optionally at a saved width.
const imageDoc = (width) => ({
  type: 'doc',
  content: [{
    type: 'paragraph',
    content: [{ type: 'image', attrs: { src: 'data:image/gif;base64,R0lGODlhAQABAAAAACw=', width } }],
  }],
});

// A one-item to-do list, at the given checked state.
const taskDoc = (checked) => ({
  type: 'doc',
  content: [{
    type: 'taskList',
    content: [{
      type: 'taskItem',
      attrs: { checked },
      content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Buy milk' }] }],
    }],
  }],
});

const renderDoc = (props) => renderWithRouter(
  <PageDocument pageId="p1" pages={[]} scopePages={[]} {...props} />,
);

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

  it('renders an image at its persisted width, with a resize handle when editable', async () => {
    const { container } = renderWithRouter(
      <PageDocument content={imageDoc(320)} editable onChange={vi.fn()} pages={[]} scopePages={[]} />,
    );
    await waitFor(() => expect(container.querySelector('.page-image img')).toBeInTheDocument());
    expect(container.querySelector('.page-image img')).toHaveStyle({ width: '320px' });
    expect(container.querySelector('.page-image__handle')).toBeInTheDocument();
  });

  it('offers no resize handle in read-only mode', async () => {
    const { container } = renderWithRouter(
      <PageDocument content={imageDoc(320)} editable={false} onChange={vi.fn()} pages={[]} scopePages={[]} />,
    );
    await waitFor(() => expect(container.querySelector('.page-image img')).toBeInTheDocument());
    expect(container.querySelector('.page-image__handle')).not.toBeInTheDocument();
  });

  // Files sit behind Bearer auth, so a reference has to be fetched and shown as a blob URL.
  it('resolves an attachment reference to a fetched object URL', async () => {
    attachmentsApi.objectUrl.mockResolvedValue('blob:resolved');
    const { container } = renderWithRouter(
      <PageDocument pageId="p1" content={refDoc()} editable onChange={vi.fn()} pages={[]} scopePages={[]} />,
    );
    await waitFor(() => expect(container.querySelector('.page-image img')).toBeInTheDocument());
    expect(container.querySelector('.page-image img')).toHaveAttribute('src', 'blob:resolved');
    expect(attachmentsApi.objectUrl).toHaveBeenCalledWith('a1');
  });

  it('shows a fallback when the attachment cannot be fetched', async () => {
    attachmentsApi.objectUrl.mockRejectedValue(new Error('gone'));
    renderWithRouter(
      <PageDocument pageId="p1" content={refDoc()} editable onChange={vi.fn()} pages={[]} scopePages={[]} />,
    );
    expect(await screen.findByText('Image unavailable')).toBeInTheDocument();
  });

  it('ticking a to-do saves the checked item and strikes it through', async () => {
    const onChange = vi.fn();
    const { container } = renderDoc({ content: taskDoc(false), editable: true, onChange });
    const box = await screen.findByRole('checkbox');

    await userEvent.click(box);

    expect(box).toBeChecked();
    // data-checked is what the stylesheet strikes through.
    expect(container.querySelector('li[data-checked="true"]')).toBeInTheDocument();
    const [saved] = onChange.mock.calls.at(-1);
    expect(saved.content[0].content[0].attrs.checked).toBe(true);
  });

  it('reloads a saved to-do already ticked', async () => {
    renderDoc({ content: taskDoc(true), editable: true, onChange: vi.fn() });
    expect(await screen.findByRole('checkbox')).toBeChecked();
  });

  // TipTap silently snaps a read-only checkbox back; the stylesheet keys off this
  // attribute to make it inert instead.
  it('leaves a read-only document non-editable, so its checkboxes save nothing', async () => {
    const onChange = vi.fn();
    const { container } = renderDoc({ content: taskDoc(false), editable: false, onChange });
    const box = await screen.findByRole('checkbox');

    await userEvent.click(box);

    expect(box).not.toBeChecked();
    expect(container.querySelector('.ProseMirror')).toHaveAttribute('contenteditable', 'false');
  });

  it('omits the table toolbar and the formatting bubble in read-only mode', async () => {
    const { container } = renderDoc({ content: '', editable: false, onChange: vi.fn() });
    await waitFor(() => expect(container.querySelector('.page-doc')).toBeInTheDocument());
    expect(container.querySelector('.page-doc__table-toolbar')).not.toBeInTheDocument();
    expect(screen.queryByRole('group', { name: 'Text colour' })).not.toBeInTheDocument();
  });
});