import { describe, it } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { BacklogPage } from './BacklogPage';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

describe('BacklogPage mount test', () => {
  it('mounts without crash', () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={qc}>
        <MemoryRouter initialEntries={['/projects/MOBT/backlog']}>
          <BacklogPage />
        </MemoryRouter>
      </QueryClientProvider>,
    );
  });
});
