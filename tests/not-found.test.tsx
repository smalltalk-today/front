import { render, screen } from '@testing-library/react';
import { expect, it } from 'vitest';
import { NotFoundContent } from '@/shared/ui';

it('keeps the home link visible and available to all visitors', () => {
  render(<NotFoundContent />);

  const link = screen.getByRole('link', { name: '홈으로' });
  expect(link).toBeVisible();
  expect(link).not.toHaveClass('sr-only');
  expect(link).toHaveAttribute('href', '/');
});
