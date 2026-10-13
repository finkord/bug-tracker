import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { MyIssuesPage } from './MyIssuesPage';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<any>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ search: '?tab=reported' }),
  };
});

describe('MyIssuesPage Redirect Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('redirects to root / with replace option and preserves query params', () => {
    render(
      <MemoryRouter>
        <MyIssuesPage />
      </MemoryRouter>,
    );

    expect(mockNavigate).toHaveBeenCalledWith(
      { pathname: '/', search: '?tab=reported' },
      { replace: true },
    );
  });
});
