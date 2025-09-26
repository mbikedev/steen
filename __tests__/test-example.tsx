import React from 'react';
import { render, screen } from '@testing-library/react';
import { Button } from '@/app/components/ui/button';

describe('Button', () => {
  it('renders a button with the correct text', () => {
    render(<Button>Click me</Button>);
    const button = screen.getByRole('button', { name: /click me/i });
    expect(button).toBeInTheDocument();
  });
});
