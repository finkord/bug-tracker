import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { Textarea } from './Textarea';

describe('Textarea', () => {
  it('renders with placeholder and value', () => {
    render(<Textarea placeholder="Enter details..." defaultValue="Hello world" />);
    const textarea = screen.getByPlaceholderText('Enter details...');
    expect(textarea).toBeInTheDocument();
    expect(textarea).toHaveValue('Hello world');
  });

  it('handles user typing and triggers onChange', () => {
    const handleChange = vi.fn();
    render(<Textarea placeholder="Type here" onChange={handleChange} />);
    const textarea = screen.getByPlaceholderText('Type here');
    fireEvent.change(textarea, { target: { value: 'New text' } });
    expect(handleChange).toHaveBeenCalled();
  });

  it('applies error styling when error prop is true', () => {
    render(<Textarea placeholder="Error test" error />);
    const textarea = screen.getByPlaceholderText('Error test');
    expect(textarea.className).toContain('border-[var(--md-sys-color-error)]');
  });

  it('respects disabled attribute', () => {
    render(<Textarea placeholder="Disabled" disabled />);
    const textarea = screen.getByPlaceholderText('Disabled');
    expect(textarea).toBeDisabled();
  });
});
