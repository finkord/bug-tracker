import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { JqlEditorBar } from './JqlEditorBar';

const mockUseValidateJqlQuery = vi.fn();

vi.mock('../../api/queries', () => ({
  useValidateJqlQuery: (query: string, enabled: boolean) => mockUseValidateJqlQuery(query, enabled),
}));

describe('JqlEditorBar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders with Empty syntax badge when query is empty', () => {
    mockUseValidateJqlQuery.mockReturnValue({ data: null, isLoading: false });

    render(
      <JqlEditorBar
        jqlQuery=""
        onJqlChange={vi.fn()}
        onSearch={vi.fn()}
        onClear={vi.fn()}
        onSwitchToBasic={vi.fn()}
      />,
    );

    expect(screen.getByText('Empty (All Issues)')).toBeInTheDocument();
  });

  it('renders Valid Syntax badge when query passes backend validation', async () => {
    mockUseValidateJqlQuery.mockReturnValue({
      data: { isValid: true, conditionsCount: 1 },
      isLoading: false,
    });

    render(
      <JqlEditorBar
        jqlQuery="status = 'OPEN'"
        onJqlChange={vi.fn()}
        onSearch={vi.fn()}
        onClear={vi.fn()}
        onSwitchToBasic={vi.fn()}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText('Valid Syntax')).toBeInTheDocument();
    });
  });

  it('renders Invalid Syntax badge and error message when query fails backend validation', async () => {
    mockUseValidateJqlQuery.mockReturnValue({
      data: { isValid: false, errorMessage: 'Invalid JQL clause: "status === UNKNOWN"', conditionsCount: 0 },
      isLoading: false,
    });

    render(
      <JqlEditorBar
        jqlQuery="status === UNKNOWN"
        onJqlChange={vi.fn()}
        onSearch={vi.fn()}
        onClear={vi.fn()}
        onSwitchToBasic={vi.fn()}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText('Invalid Syntax')).toBeInTheDocument();
      expect(screen.getByText(/Invalid JQL clause/)).toBeInTheDocument();
    });
  });
});
