import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { SidebarNavList } from './SidebarNavList';

describe('SidebarNavList Component', () => {
  it('renders guest public navigation items when user is null', () => {
    render(
      <MemoryRouter>
        <SidebarNavList user={null} />
      </MemoryRouter>,
    );

    expect(screen.getByRole('navigation', { name: /guest navigation/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /overview/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /sign in/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /create account/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /forgot password/i })).toBeInTheDocument();

    expect(screen.queryByRole('link', { name: /kanban board/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /backlog/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /admin center/i })).not.toBeInTheDocument();
  });
});
