import { describe, it, expect, vi } from 'vitest';
import { render, screen, userEvent } from '../../test/utils';
import Modal from './Modal';

describe('Modal', () => {
  it('renders the title and children with a dialog role', () => {
    render(<Modal title="Hello" onClose={vi.fn()}><p>body</p></Modal>);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Hello' })).toBeInTheDocument();
    expect(screen.getByText('body')).toBeInTheDocument();
  });

  it('closes when the header X is clicked', async () => {
    const onClose = vi.fn();
    render(<Modal title="T" onClose={onClose}>x</Modal>);
    await userEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('closes on Escape', async () => {
    const onClose = vi.fn();
    render(<Modal title="T" onClose={onClose}>x</Modal>);
    await userEvent.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('closes on overlay click but not on inner click', async () => {
    const onClose = vi.fn();
    render(<Modal title="T" onClose={onClose}>x</Modal>);
    await userEvent.click(screen.getByRole('dialog'));
    expect(onClose).not.toHaveBeenCalled();
    await userEvent.click(document.querySelector('.modal-overlay'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('hides the X when showClose is false', () => {
    render(<Modal title="T" onClose={vi.fn()} showClose={false}>x</Modal>);
    expect(screen.queryByRole('button', { name: 'Close' })).not.toBeInTheDocument();
  });

  it('blocks Escape and overlay close while closeDisabled', async () => {
    const onClose = vi.fn();
    render(<Modal title="T" onClose={onClose} closeDisabled>x</Modal>);
    await userEvent.keyboard('{Escape}');
    await userEvent.click(document.querySelector('.modal-overlay'));
    expect(onClose).not.toHaveBeenCalled();
  });

  // The variant only changes styling below the tablet breakpoint, so the class is the
  // contract — it is what the mobile stylesheet hangs off.
  it('renders as a sheet by default', () => {
    render(<Modal title="T" onClose={vi.fn()}>x</Modal>);
    expect(document.querySelector('.modal')).toHaveClass('modal--sheet');
    expect(document.querySelector('.modal-overlay')).toHaveClass('modal-overlay--sheet');
  });

  it('renders full-screen when asked', () => {
    render(<Modal title="T" onClose={vi.fn()} variant="full">x</Modal>);
    expect(document.querySelector('.modal')).toHaveClass('modal--full');
    expect(document.querySelector('.modal')).not.toHaveClass('modal--sheet');
  });
});