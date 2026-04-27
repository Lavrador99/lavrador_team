import React from 'react';
import { render, screen } from '@testing-library/react';
import { EmptyState, LoadingState } from '../EmptyState';

describe('EmptyState', () => {
  it('renders the title', () => {
    render(<EmptyState title="Nenhum resultado encontrado" />);
    expect(screen.getByText('Nenhum resultado encontrado')).toBeInTheDocument();
  });

  it('renders the default icon', () => {
    render(<EmptyState title="Empty" />);
    expect(screen.getByText('inbox')).toBeInTheDocument();
  });

  it('renders a custom icon when provided', () => {
    render(<EmptyState title="Empty" icon="search" />);
    expect(screen.getByText('search')).toBeInTheDocument();
  });

  it('renders an action node when provided', () => {
    render(
      <EmptyState
        title="Sem dados"
        action={<button>Adicionar</button>}
      />
    );
    expect(screen.getByRole('button', { name: 'Adicionar' })).toBeInTheDocument();
  });

  it('does not render an action when not provided', () => {
    render(<EmptyState title="Sem dados" />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('applies page size padding class by default', () => {
    const { container } = render(<EmptyState title="Test" />);
    expect(container.firstChild).toHaveClass('py-20');
  });

  it('applies section size padding class when size is section', () => {
    const { container } = render(<EmptyState title="Test" size="section" />);
    expect(container.firstChild).toHaveClass('py-10');
  });
});

describe('LoadingState', () => {
  it('renders the default loading message', () => {
    render(<LoadingState />);
    expect(screen.getByText('A carregar...')).toBeInTheDocument();
  });

  it('renders a custom message when provided', () => {
    render(<LoadingState message="Por favor aguarde..." />);
    expect(screen.getByText('Por favor aguarde...')).toBeInTheDocument();
  });
});
