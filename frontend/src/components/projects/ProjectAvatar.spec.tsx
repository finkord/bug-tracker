import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProjectAvatar } from './ProjectAvatar.js';

describe('ProjectAvatar component', () => {
  it('renders fallback letters from projectKey', () => {
    render(<ProjectAvatar name="Core Engine" projectKey="CORE" />);
    expect(screen.getByText('COR')).toBeInTheDocument();
  });

  it('renders fallback letters from name when projectKey is missing', () => {
    render(<ProjectAvatar name="Mobile Tracker" />);
    expect(screen.getByText('MT')).toBeInTheDocument();
  });

  it('renders image when avatarUrl is an image link', () => {
    render(
      <ProjectAvatar
        name="Mobile Tracker"
        projectKey="MOBT"
        avatarUrl="/api/v1/projects/avatar/test-fid"
      />,
    );
    const img = screen.getByRole('img');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', '/api/v1/projects/avatar/test-fid');
  });

  it('renders preset geometric icon when avatarUrl starts with preset:', () => {
    const { container } = render(
      <ProjectAvatar
        name="Mobile Tracker"
        projectKey="MOBT"
        avatarUrl="preset:rocket:indigo"
      />,
    );
    expect(container.querySelector('svg')).toBeInTheDocument();
  });
});
