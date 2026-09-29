import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { VirtualList } from './VirtualList';

describe('VirtualList', () => {
  it('should render empty message when items array is empty', () => {
    render(
      <VirtualList
        items={[]}
        estimateSize={40}
        height={300}
        emptyMessage="No tasks available"
        renderItem={(item) => <div>{String(item)}</div>}
      />,
    );

    expect(screen.getByText('No tasks available')).toBeInTheDocument();
  });

  it('should render items when non-empty', () => {
    const items = ['Task Alpha', 'Task Beta', 'Task Gamma'];

    render(
      <VirtualList
        items={items}
        estimateSize={40}
        height={300}
        renderItem={(item, index) => <div key={index} data-testid="virtual-row">{item}</div>}
      />,
    );

    const rows = screen.getAllByTestId('virtual-row');
    expect(rows.length).toBeGreaterThan(0);
    expect(screen.getByText('Task Alpha')).toBeInTheDocument();
  });
});
