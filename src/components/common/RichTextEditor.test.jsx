import { describe, it, expect, vi } from 'vitest';
import { render } from '../../test/utils';
import RichTextEditor from './RichTextEditor';

// TipTap drives a real contentEditable; these are smoke tests that it mounts under jsdom
// and exposes the shared .page-doc surface without throwing.
describe('RichTextEditor', () => {
  it('renders an editable document surface', () => {
    const { container } = render(<RichTextEditor content="" onChange={vi.fn()} />);
    const doc = container.querySelector('.page-doc');
    expect(doc).toBeInTheDocument();
    expect(doc.querySelector('[contenteditable="true"]')).toBeInTheDocument();
  });

  it('renders read-only when editable is false', () => {
    const content = { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Hello world' }] }] };
    const { container } = render(<RichTextEditor content={content} editable={false} onChange={vi.fn()} />);
    expect(container.querySelector('[contenteditable="false"]')).toBeInTheDocument();
    expect(container.textContent).toContain('Hello world');
  });
});