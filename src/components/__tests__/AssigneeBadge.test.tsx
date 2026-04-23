// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AssigneeBadge } from '../AssigneeBadge';

describe('AssigneeBadge', () => {
  it('renders initials and name when a user is assigned', () => {
    render(<AssigneeBadge user={{ id: 'u1', name: 'Max Mustermann' }} />);
    expect(screen.getByText('MM')).toBeInTheDocument();
    expect(screen.getByText('Max Mustermann')).toBeInTheDocument();
  });

  it('renders "Nicht zugewiesen" when user is null', () => {
    render(<AssigneeBadge user={null} />);
    expect(screen.getByText('Nicht zugewiesen')).toBeInTheDocument();
  });

  it('hides the name when showName=false', () => {
    render(<AssigneeBadge user={{ id: 'u1', name: 'Max Mustermann' }} showName={false} />);
    expect(screen.queryByText('Max Mustermann')).not.toBeInTheDocument();
    expect(screen.getByText('MM')).toBeInTheDocument();
  });

  it('computes single-letter initial for mononym', () => {
    render(<AssigneeBadge user={{ id: 'u1', name: 'Cher' }} />);
    expect(screen.getByText('C')).toBeInTheDocument();
  });

  it('applies the sm size class when size=sm', () => {
    const { container } = render(<AssigneeBadge user={null} size="sm" />);
    expect(container.querySelector('.h-5')).not.toBeNull();
  });
});
