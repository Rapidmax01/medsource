import { describe, it, expect, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '../test-utils';
import LoginPage from '../../pages/LoginPage';
import { authApi } from '../../services/api';

describe('LoginPage', () => {
  it('renders the MedSource title', () => {
    render(<LoginPage />);
    expect(screen.getByText('MedSource')).toBeInTheDocument();
  });

  it('renders the subtitle text', () => {
    render(<LoginPage />);
    expect(screen.getByText("Nigeria's Healthcare Marketplace")).toBeInTheDocument();
  });

  it('renders the phone number label', () => {
    render(<LoginPage />);
    expect(screen.getByLabelText('Phone Number')).toBeInTheDocument();
  });

  it('renders the phone input field', () => {
    render(<LoginPage />);
    const input = screen.getByPlaceholderText('8012345678');
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('type', 'tel');
  });

  it('renders the +234 prefix', () => {
    render(<LoginPage />);
    expect(screen.getByText('+234')).toBeInTheDocument();
  });

  it('renders the Continue button', () => {
    render(<LoginPage />);
    expect(screen.getByRole('button', { name: /continue/i })).toBeInTheDocument();
  });

  it('Continue button is disabled when phone is empty', () => {
    render(<LoginPage />);
    const button = screen.getByRole('button', { name: /continue/i });
    expect(button).toBeDisabled();
  });

  it('Continue button becomes enabled after typing a phone number', async () => {
    const user = userEvent.setup();
    render(<LoginPage />);
    const input = screen.getByPlaceholderText('8012345678');
    await user.type(input, '8012345678');
    const button = screen.getByRole('button', { name: /continue/i });
    expect(button).not.toBeDisabled();
  });

  it('shows info text about auto account creation', () => {
    render(<LoginPage />);
    expect(
      screen.getByText(/new to medsource\? your account will be created automatically/i)
    ).toBeInTheDocument();
  });

  it('calls authApi.sendOtp on valid phone submission', async () => {
    authApi.sendOtp.mockResolvedValueOnce({ success: true });
    const user = userEvent.setup();
    render(<LoginPage />);

    const input = screen.getByPlaceholderText('8012345678');
    await user.type(input, '08012345678');

    const button = screen.getByRole('button', { name: /continue/i });
    await user.click(button);

    await waitFor(() => {
      expect(authApi.sendOtp).toHaveBeenCalledWith('+2348012345678');
    });
  });
});
