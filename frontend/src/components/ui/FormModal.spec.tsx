import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FormModal } from './FormModal';

describe('FormModal', () => {
  it('renders title, description, and children when open', () => {
    render(
      <FormModal
        isOpen={true}
        onClose={vi.fn()}
        title="Test Modal"
        description="Test modal description"
        onSubmit={vi.fn()}
      >
        <div data-testid="modal-content">Form Content</div>
      </FormModal>,
    );

    expect(screen.getByText('Test Modal')).toBeInTheDocument();
    expect(screen.getByText('Test modal description')).toBeInTheDocument();
    expect(screen.getByTestId('modal-content')).toBeInTheDocument();
  });

  it('renders error alert banner when error prop is present', () => {
    render(
      <FormModal
        isOpen={true}
        onClose={vi.fn()}
        title="Error Modal"
        onSubmit={vi.fn()}
        error="Invalid form submission"
      >
        <div>Content</div>
      </FormModal>,
    );

    const alertBanner = screen.getByRole('alert');
    expect(alertBanner).toBeInTheDocument();
    expect(alertBanner).toHaveTextContent('Invalid form submission');
  });

  it('handles form submission when submit button is clicked', () => {
    const handleSubmit = vi.fn((e) => e.preventDefault());
    render(
      <FormModal
        isOpen={true}
        onClose={vi.fn()}
        title="Submit Modal"
        onSubmit={handleSubmit}
        submitLabel="Submit Action"
      >
        <div>Content</div>
      </FormModal>,
    );

    const submitBtn = screen.getByText('Submit Action');
    fireEvent.click(submitBtn);

    expect(handleSubmit).toHaveBeenCalledTimes(1);
  });

  it('triggers onClose when Cancel button is clicked', () => {
    const handleClose = vi.fn();
    render(
      <FormModal
        isOpen={true}
        onClose={handleClose}
        title="Cancel Modal"
        onSubmit={vi.fn()}
        cancelLabel="Discard"
      >
        <div>Content</div>
      </FormModal>,
    );

    const cancelBtn = screen.getByText('Discard');
    fireEvent.click(cancelBtn);

    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('disables submit button and displays loading text when isSubmitting is true', () => {
    const handleSubmit = vi.fn();
    render(
      <FormModal
        isOpen={true}
        onClose={vi.fn()}
        title="Loading Modal"
        onSubmit={handleSubmit}
        isSubmitting={true}
        submitLabel="Save"
        submittingLabel="Saving in progress..."
      >
        <div>Content</div>
      </FormModal>,
    );

    const submitBtn = screen.getByText('Saving in progress...').closest('button');
    expect(submitBtn).toBeDisabled();

    // Clicking disabled button should not fire submit
    if (submitBtn) fireEvent.click(submitBtn);
    expect(handleSubmit).not.toHaveBeenCalled();
  });

  it('renders extraFooter content on the left side of footer', () => {
    render(
      <FormModal
        isOpen={true}
        onClose={vi.fn()}
        title="Extra Footer Modal"
        onSubmit={vi.fn()}
        extraFooter={<button type="button">Delete Item</button>}
      >
        <div>Content</div>
      </FormModal>,
    );

    expect(screen.getByText('Delete Item')).toBeInTheDocument();
  });
});
