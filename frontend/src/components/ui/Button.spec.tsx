import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Button } from './Button';
import { Plus, ArrowRight } from 'lucide-react';

describe('Button', () => {
  it('renders button with children wrapped in inline-flex items-center', () => {
    render(
      <Button>
        <Plus data-testid="plus-icon" className="w-4 h-4" />
        <span>Add Issue</span>
      </Button>,
    );

    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
    expect(screen.getByText('Add Issue')).toBeInTheDocument();
    expect(screen.getByTestId('plus-icon')).toBeInTheDocument();

    // Verify children wrapper has inline-flex and whitespace-nowrap
    const wrapper = screen.getByText('Add Issue').parentElement;
    expect(wrapper).toHaveClass('inline-flex');
    expect(wrapper).toHaveClass('items-center');
    expect(wrapper).toHaveClass('whitespace-nowrap');
  });

  it('renders leftIcon and rightIcon properly', () => {
    render(
      <Button
        leftIcon={<Plus data-testid="left-icon" />}
        rightIcon={<ArrowRight data-testid="right-icon" />}
      >
        Submit Task
      </Button>,
    );

    expect(screen.getByTestId('left-icon')).toBeInTheDocument();
    expect(screen.getByTestId('right-icon')).toBeInTheDocument();
    expect(screen.getByText('Submit Task')).toBeInTheDocument();
  });

  it('handles loading state with spinner', () => {
    render(<Button isLoading>Save Changes</Button>);
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });
});
