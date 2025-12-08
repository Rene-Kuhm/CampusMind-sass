import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ForgotPasswordPage from '@/app/(auth)/forgot-password/page';
import { passwordReset } from '@/lib/api';

// Mock next/link
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  );
});

// Mock the API
jest.mock('@/lib/api', () => ({
  passwordReset: {
    requestReset: jest.fn(),
  },
}));

const mockPasswordReset = passwordReset as jest.Mocked<typeof passwordReset>;

describe('ForgotPasswordPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the forgot password form', () => {
    render(<ForgotPasswordPage />);

    expect(screen.getByText('CampusMind')).toBeInTheDocument();
    expect(screen.getByText('Recuperar contraseña')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /enviar enlace de recuperación/i })).toBeInTheDocument();
    expect(screen.getByText('Volver al inicio de sesión')).toBeInTheDocument();
  });

  it('submits the form with valid email', async () => {
    const user = userEvent.setup();
    mockPasswordReset.requestReset.mockResolvedValue({ message: 'Email sent' });

    render(<ForgotPasswordPage />);

    const emailInput = screen.getByLabelText('Email');
    const submitButton = screen.getByRole('button', { name: /enviar enlace de recuperación/i });

    await user.type(emailInput, 'test@example.com');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockPasswordReset.requestReset).toHaveBeenCalledWith('test@example.com');
    });
  });

  it('shows success message after successful submission', async () => {
    const user = userEvent.setup();
    mockPasswordReset.requestReset.mockResolvedValue({ message: 'Email sent' });

    render(<ForgotPasswordPage />);

    const emailInput = screen.getByLabelText('Email');
    const submitButton = screen.getByRole('button', { name: /enviar enlace de recuperación/i });

    await user.type(emailInput, 'test@example.com');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Revisa tu email')).toBeInTheDocument();
      expect(screen.getByText(/test@example.com/)).toBeInTheDocument();
    });
  });

  it('shows error message on API failure', async () => {
    const user = userEvent.setup();
    mockPasswordReset.requestReset.mockRejectedValue(new Error('Network error'));

    render(<ForgotPasswordPage />);

    const emailInput = screen.getByLabelText('Email');
    const submitButton = screen.getByRole('button', { name: /enviar enlace de recuperación/i });

    await user.type(emailInput, 'test@example.com');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });
  });

  it('shows loading state while submitting', async () => {
    const user = userEvent.setup();
    mockPasswordReset.requestReset.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({ message: 'sent' }), 1000))
    );

    render(<ForgotPasswordPage />);

    const emailInput = screen.getByLabelText('Email');
    const submitButton = screen.getByRole('button', { name: /enviar enlace de recuperación/i });

    await user.type(emailInput, 'test@example.com');
    await user.click(submitButton);

    expect(screen.getByText('Enviando...')).toBeInTheDocument();
  });

  it('disables submit button while loading', async () => {
    const user = userEvent.setup();
    mockPasswordReset.requestReset.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({ message: 'sent' }), 1000))
    );

    render(<ForgotPasswordPage />);

    const emailInput = screen.getByLabelText('Email');
    const submitButton = screen.getByRole('button', { name: /enviar enlace de recuperación/i });

    await user.type(emailInput, 'test@example.com');
    await user.click(submitButton);

    expect(submitButton).toBeDisabled();
  });

  it('has a link to login page', () => {
    render(<ForgotPasswordPage />);

    const loginLink = screen.getByText('Volver al inicio de sesión');
    expect(loginLink).toHaveAttribute('href', '/login');
  });

  it('requires email input', () => {
    render(<ForgotPasswordPage />);

    const emailInput = screen.getByLabelText('Email');
    expect(emailInput).toBeRequired();
    expect(emailInput).toHaveAttribute('type', 'email');
  });
});
