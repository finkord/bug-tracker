import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AvatarPicker } from './AvatarPicker';

describe('AvatarPicker Component', () => {
  it('renders preset icons and allows selecting an icon', () => {
    const handleChange = vi.fn();
    render(<AvatarPicker name="Alpha Team" onChange={handleChange} />);

    expect(screen.getByText('Avatar & Identity')).toBeInTheDocument();
    expect(screen.getByText('Preset')).toBeInTheDocument();
    expect(screen.getByText('Upload')).toBeInTheDocument();

    const shieldBtn = screen.getByTitle('Shield');
    fireEvent.click(shieldBtn);

    expect(handleChange).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: 'preset',
        presetUrl: expect.stringContaining('preset:shield:'),
      }),
    );
  });

  it('switches to upload mode and handles file upload', () => {
    const handleChange = vi.fn();
    render(<AvatarPicker name="Alpha Team" onChange={handleChange} />);

    fireEvent.click(screen.getByText('Upload'));
    expect(screen.getByText('Select Image File')).toBeInTheDocument();

    const file = new File(['dummy-content'], 'avatar.png', { type: 'image/png' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;

    fireEvent.change(input, { target: { files: [file] } });

    expect(handleChange).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: 'upload',
        file,
      }),
    );
  });

  it('validates file size and triggers onError if greater than 5MB', () => {
    const handleError = vi.fn();
    render(<AvatarPicker name="Alpha Team" onChange={vi.fn()} onError={handleError} />);

    fireEvent.click(screen.getByText('Upload'));

    // Create 6MB dummy file
    const bigFile = new File([new ArrayBuffer(6 * 1024 * 1024)], 'huge.png', { type: 'image/png' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;

    fireEvent.change(input, { target: { files: [bigFile] } });

    expect(handleError).toHaveBeenCalledWith('Image file must not exceed 5MB');
  });
});
