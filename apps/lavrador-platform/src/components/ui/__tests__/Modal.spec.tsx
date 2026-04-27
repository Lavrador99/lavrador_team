import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Modal } from '../Modal';

describe('Modal', () => {
  it('renders the modal title', () => {
    const onClose = jest.fn();
    render(
      <Modal title="Confirmar acção" onClose={onClose}>
        <p>Conteúdo do modal</p>
      </Modal>
    );
    expect(screen.getByText('Confirmar acção')).toBeInTheDocument();
  });

  it('renders children content', () => {
    const onClose = jest.fn();
    render(
      <Modal title="Título" onClose={onClose}>
        <p>Texto interno</p>
      </Modal>
    );
    expect(screen.getByText('Texto interno')).toBeInTheDocument();
  });

  it('renders optional footer when provided', () => {
    const onClose = jest.fn();
    render(
      <Modal title="Título" onClose={onClose} footer={<button>Guardar</button>}>
        <p>Body</p>
      </Modal>
    );
    expect(screen.getByRole('button', { name: 'Guardar' })).toBeInTheDocument();
  });

  it('calls onClose when the close button is clicked', async () => {
    const user = userEvent.setup();
    const onClose = jest.fn();
    render(
      <Modal title="Título" onClose={onClose}>
        <p>Body</p>
      </Modal>
    );

    // The close button contains the material icon "close"
    const closeButton = screen.getByRole('button');
    await user.click(closeButton);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when clicking the backdrop overlay', async () => {
    const user = userEvent.setup();
    const onClose = jest.fn();
    const { container } = render(
      <Modal title="Título" onClose={onClose}>
        <p>Body</p>
      </Modal>
    );

    // Click the fixed overlay (first child of the container)
    const overlay = container.firstChild as HTMLElement;
    await user.click(overlay);
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onClose when the Escape key is pressed', async () => {
    const user = userEvent.setup();
    const onClose = jest.fn();
    render(
      <Modal title="Título" onClose={onClose}>
        <p>Body</p>
      </Modal>
    );

    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not propagate click from inner panel to backdrop', async () => {
    const user = userEvent.setup();
    const onClose = jest.fn();
    render(
      <Modal title="Título" onClose={onClose}>
        <p>Texto interno</p>
      </Modal>
    );

    // Click inside the modal panel content — onClose should NOT be called
    await user.click(screen.getByText('Texto interno'));
    expect(onClose).not.toHaveBeenCalled();
  });
});
