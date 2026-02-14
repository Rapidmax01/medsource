import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider, useAuth } from '../../context/AuthContext';
import { authApi } from '../../services/api';
import { requestNotificationPermission } from '../../services/firebase';

// Test component that exposes auth context values
function AuthConsumer() {
  const { user, loading, login, logout, updateUser, isSeller, isAdmin } = useAuth();
  return (
    <div>
      <span data-testid="user">{user ? JSON.stringify(user) : 'null'}</span>
      <span data-testid="loading">{loading.toString()}</span>
      <span data-testid="isSeller">{isSeller.toString()}</span>
      <span data-testid="isAdmin">{isAdmin.toString()}</span>
      <button onClick={() => login('test-token', { id: '1', name: 'Test User', role: 'BUYER' })}>
        Login
      </button>
      <button onClick={() => logout()}>Logout</button>
      <button onClick={() => updateUser({ name: 'Updated Name' })}>Update</button>
    </div>
  );
}

describe('AuthContext', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    authApi.getMe.mockRejectedValue(new Error('Not authenticated'));
    requestNotificationPermission.mockResolvedValue(null);
  });

  it('provides user as null when no stored token', async () => {
    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });

    expect(screen.getByTestId('user').textContent).toBe('null');
  });

  it('isSeller is false for no user', async () => {
    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });

    expect(screen.getByTestId('isSeller').textContent).toBe('false');
  });

  it('login() stores token and user', async () => {
    const user = userEvent.setup();
    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });

    await user.click(screen.getByText('Login'));

    expect(screen.getByTestId('user').textContent).toContain('Test User');
    expect(localStorage.getItem('medsource_token')).toBe('test-token');
    expect(JSON.parse(localStorage.getItem('medsource_user'))).toEqual({
      id: '1',
      name: 'Test User',
      role: 'BUYER',
    });
  });

  it('logout() clears token and user', async () => {
    const user = userEvent.setup();
    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });

    // Login first
    await user.click(screen.getByText('Login'));
    expect(screen.getByTestId('user').textContent).toContain('Test User');

    // Then logout
    await user.click(screen.getByText('Logout'));
    expect(screen.getByTestId('user').textContent).toBe('null');
    expect(localStorage.getItem('medsource_token')).toBeNull();
    expect(localStorage.getItem('medsource_user')).toBeNull();
  });

  it('updateUser() merges user data', async () => {
    const user = userEvent.setup();
    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });

    // Login first
    await user.click(screen.getByText('Login'));
    expect(screen.getByTestId('user').textContent).toContain('Test User');

    // Update
    await user.click(screen.getByText('Update'));
    expect(screen.getByTestId('user').textContent).toContain('Updated Name');
    // Original fields should still be present
    expect(screen.getByTestId('user').textContent).toContain('BUYER');
  });

  it('fetches user from API when token exists in storage', async () => {
    localStorage.setItem('medsource_token', 'existing-token');
    localStorage.setItem(
      'medsource_user',
      JSON.stringify({ id: '1', name: 'Stored User', role: 'BUYER' })
    );

    authApi.getMe.mockResolvedValueOnce({ user: { id: '1', name: 'Fresh User', role: 'SELLER' } });

    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });

    expect(authApi.getMe).toHaveBeenCalled();
    expect(screen.getByTestId('user').textContent).toContain('Fresh User');
    expect(screen.getByTestId('isSeller').textContent).toBe('true');
  });

  it('clears auth when getMe fails with existing token', async () => {
    localStorage.setItem('medsource_token', 'bad-token');
    localStorage.setItem(
      'medsource_user',
      JSON.stringify({ id: '1', name: 'Old User', role: 'BUYER' })
    );

    authApi.getMe.mockRejectedValueOnce(new Error('Unauthorized'));

    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });

    expect(screen.getByTestId('user').textContent).toBe('null');
    expect(localStorage.getItem('medsource_token')).toBeNull();
  });

  it('login() triggers push notification permission request', async () => {
    const user = userEvent.setup();
    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });

    await user.click(screen.getByText('Login'));

    expect(requestNotificationPermission).toHaveBeenCalled();
  });
});
