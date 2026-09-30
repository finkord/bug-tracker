import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Footer } from './Footer';

describe('Footer Component', () => {
  it('renders brand identity, description, and copyright notice', () => {
    render(
      <MemoryRouter>
        <Footer />
      </MemoryRouter>,
    );

    expect(screen.getByText('BugTracker')).toBeInTheDocument();
    expect(
      screen.getByText(/high-performance developer issue tracking/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/all rights reserved/i),
    ).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /sign in/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /create account/i })).not.toBeInTheDocument();
  });


  it('does not render status indicator or removed developer tools and product links', () => {
    render(
      <MemoryRouter>
        <Footer />
      </MemoryRouter>,
    );

    expect(screen.queryByText(/all systems operational/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/developer tools/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/product/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/mailpit/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/swagger openapi/i)).not.toBeInTheDocument();
  });
});
