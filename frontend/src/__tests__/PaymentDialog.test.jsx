import { render, screen, fireEvent } from '@testing-library/react';
import PaymentDialog from '@/components/billing/PaymentDialog';
import { describe, it, expect, vi } from 'vitest';

describe('PaymentDialog', () => {
  const defaultProps = {
    open: true,
    onClose: vi.fn(),
    total: 1000,
    onSubmit: vi.fn(),
    loading: false,
  };

  it('renders the total amount', () => {
    render(<PaymentDialog {...defaultProps} />);
    expect(screen.getByText('Receive Payment')).toBeInTheDocument();
    expect(screen.getByText('₹1000.00')).toBeInTheDocument();
  });

  it('shows all payment methods', () => {
    render(<PaymentDialog {...defaultProps} />);
    expect(screen.getByText('Cash')).toBeInTheDocument();
    expect(screen.getByText('UPI')).toBeInTheDocument();
    expect(screen.getByText('Bank Transfer')).toBeInTheDocument();
  });

  it('defaults amount paid to total', () => {
    render(<PaymentDialog {...defaultProps} />);
    const input = screen.getByLabelText(/amount paid/i);
    expect(input.value).toBe('1000');
  });

  it('disables complete sale button when amount is 0', () => {
    render(<PaymentDialog {...defaultProps} />);
    fireEvent.change(screen.getByLabelText(/amount paid/i), { target: { value: '0' } });
    expect(screen.getByRole('button', { name: /complete sale/i })).toBeDisabled();
  });

  it('shows transaction ref field for UPI', () => {
    render(<PaymentDialog {...defaultProps} />);
    fireEvent.click(screen.getByText('UPI'));
    expect(screen.getByPlaceholderText(/upi ref/i)).toBeInTheDocument();
  });

  it('shows balance due when partial payment', () => {
    render(<PaymentDialog {...defaultProps} />);
    fireEvent.change(screen.getByLabelText(/amount paid/i), { target: { value: '600' } });
    expect(screen.getByText(/Balance Due: ₹400.00/)).toBeInTheDocument();
  });

  it('calls onSubmit with correct data', () => {
    const onSubmit = vi.fn();
    render(<PaymentDialog {...defaultProps} onSubmit={onSubmit} />);
    fireEvent.click(screen.getByRole('button', { name: /complete sale/i }));
    expect(onSubmit).toHaveBeenCalledWith({
      amountPaid: 1000,
      paymentMethod: 'cash',
      transactionRef: undefined,
    });
  });
});
