import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ResetPasswordPage from '@/app/(auth)/reset-password/page';
import { passwordReset } from '@/lib/api';

// Mock next/navigation
const mockPush = jest.fn();
const mockSearchParams = new Map<string, string>();

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  useSearchParams: () => ({
    get: (key: string) => mockSearchParams.get(key) || null,
  }),
}));

// Mock next/link
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  );
});

// Mock the API
jest.mock('@/lib/api', () => ({
  passwordReset: {
    validateToken: jest.fn(),
    resetPassword: jest.fn(),
  },
}));

const mockPasswordReset = passwordReset as jest.Mocked<typeof passwordReset>;

describe('ResetPasswordPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSearchParams.clear();
  });

  describe('with valid token', () => {
    beforeEach(() => {
      mockSearchParams.set('token', 'valid-token');
      mockSearchParams.set('email', 'test@example.com');
      mockPasswordReset.validateToken.mockResolvedValue({ valid: true });
    });

    it('renders the reset password form after validation', async () => {
      render(<ResetPasswordPage />);

      // First shows loading
      expect(screen.getByText('Validando enlace...')).toBeInTheDocument();

      // Then shows form
      await waitFor(() => {
        expect(screen.getByText('Nueva contraseña')).toBeInTheDocument();
      });

      expect(screen.getByLabelText('Nueva contraseña')).toBeInTheDocument();
      expect(screen.getByLabelText('Confirmar contraseña')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /restablecer contraseña/i })).toBeInTheDocument();
    });

    it('validates password match', async () => {
      const user = userEvent.setup();
      render(<ResetPasswordPage />);

      await waitFor(() => {
        expect(screen.getByLabelText('Nueva contraseña')).toBeInTheDocument();
      });

      const passwordInput = screen.getByLabelText('Nueva contraseña');
      const confirmInput = screen.getByLabelText('Confirmar contraseña');
      const submitButton = screen.getByRole('button', { name: /restablecer contraseña/i });

      await user.type(passwordInput, 'password123');
      await user.type(confirmInput, 'differentpassword');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Las contraseñas no coinciden')).toBeInTheDocument();
      });
    });

    it('validates password length', async () => {
      const user = userEvent.setup();
      render(<ResetPasswordPage />);

      await waitFor(() => {
        expect(screen.getByLabelText('Nueva contraseña')).toBeInTheDocument();
      });

      const passwordInput = screen.getByLabelText('Nueva contraseña');
      const confirmInput = screen.getByLabelText('Confirmar contraseña');
      const submitButton = screen.getByRole('button', { name: /restablecer contraseña/i });

      await user.type(passwordInput, 'short');
      await user.type(confirmInput, 'short');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('La contraseña debe tener al menos 8 caracteres')).toBeInTheDocument();
      });
    });

    it('submits valid password reset', async () => {
      const user = userEvent.setup();
      mockPasswordReset.resetPassword.mockResolvedValue({ message: 'Password reset' });

      render(<ResetPasswordPage />);

      await waitFor(() => {
        expect(screen.getByLabelText('Nueva contraseña')).toBeInTheDocument();
      });

      const passwordInput = screen.getByLabelText('Nueva contraseña');
      const confirmInput = screen.getByLabelText('Confirmar contraseña');
      const submitButton = screen.getByRole('button', { name: /restablecer contraseña/i });

      await user.type(passwordInput, 'newpassword123');
      await user.type(confirmInput, 'newpassword123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockPasswordReset.resetPassword).toHaveBeenCalledWith(
          'test@example.com',
          'valid-token',
          'newpassword123'
        );
      });
    });

    it('shows success message after password reset', async () => {
      const user = userEvent.setup();
      mockPasswordReset.resetPassword.mockResolvedValue({ message: 'Password reset' });

      render(<ResetPasswordPage />);

      await waitFor(() => {
        expect(screen.getByLabelText('Nueva contraseña')).toBeInTheDocument();
      });

      const passwordInput = screen.getByLabelText('Nueva contraseña');
      const confirmInput = screen.getByLabelText('Confirmar contraseña');
      const submitButton = screen.getByRole('button', { name: /restablecer contraseña/i });

      await user.type(passwordInput, 'newpassword123');
      await user.type(confirmInput, 'newpassword123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Contraseña actualizada')).toBeInTheDocument();
      });
    });

    it('shows loading state while submitting', async () => {
      const user = userEvent.setup();
      mockPasswordReset.resetPassword.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ message: 'done' }), 1000))
      );

      render(<ResetPasswordPage />);

      await waitFor(() => {
        expect(screen.getByLabelText('Nueva contraseña')).toBeInTheDocument();
      });

      const passwordInput = screen.getByLabelText('Nueva contraseña');
      const confirmInput = screen.getByLabelText('Confirmar contraseña');
      const submitButton = screen.getByRole('button', { name: /restablecer contraseña/i });

      await user.type(passwordInput, 'newpassword123');
      await user.type(confirmInput, 'newpassword123');
      await user.click(submitButton);

      expect(screen.getByText('Actualizando...')).toBeInTheDocument();
    });

    it('shows error on API failure', async () => {
      const user = userEvent.setup();
      mockPasswordReset.resetPassword.mockRejectedValue(new Error('Token expired'));

      render(<ResetPasswordPage />);

      await waitFor(() => {
        expect(screen.getByLabelText('Nueva contraseña')).toBeInTheDocument();
      });

      const passwordInput = screen.getByLabelText('Nueva contraseña');
      const confirmInput = screen.getByLabelText('Confirmar contraseña');
      const submitButton = screen.getByRole('button', { name: /restablecer contraseña/i });

      await user.type(passwordInput, 'newpassword123');
      await user.type(confirmInput, 'newpassword123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Token expired')).toBeInTheDocument();
      });
    });
  });

  describe('with invalid token', () => {
    beforeEach(() => {
      mockSearchParams.set('token', 'invalid-token');
      mockSearchParams.set('email', 'test@example.com');
      mockPasswordReset.validateToken.mockResolvedValue({ valid: false });
    });

    it('shows invalid link message', async () => {
      render(<ResetPasswordPage />);

      await waitFor(() => {
        expect(screen.getByText('Enlace inválido')).toBeInTheDocument();
      });

      expect(screen.getByText(/enlace de recuperación es inválido o ha expirado/i)).toBeInTheDocument();
      expect(screen.getByText('Solicitar nuevo enlace')).toBeInTheDocument();
    });

    it('has link to request new reset', async () => {
      render(<ResetPasswordPage />);

      await waitFor(() => {
        expect(screen.getByText('Enlace inválido')).toBeInTheDocument();
      });

      const link = screen.getByText('Solicitar nuevo enlace');
      expect(link).toHaveAttribute('href', '/forgot-password');
    });
  });

  describe('with missing parameters', () => {
    it('shows invalid link when token is missing', async () => {
      mockSearchParams.set('email', 'test@example.com');
      // No token

      render(<ResetPasswordPage />);

      await waitFor(() => {
        expect(screen.getByText('Enlace inválido')).toBeInTheDocument();
      });
    });

    it('shows invalid link when email is missing', async () => {
      mockSearchParams.set('token', 'some-token');
      // No email

      render(<ResetPasswordPage />);

      await waitFor(() => {
        expect(screen.getByText('Enlace inválido')).toBeInTheDocument();
      });
    });
  });

  describe('validation error', () => {
    beforeEach(() => {
      mockSearchParams.set('token', 'token');
      mockSearchParams.set('email', 'test@example.com');
      mockPasswordReset.validateToken.mockRejectedValue(new Error('Validation error'));
    });

    it('shows invalid link on validation error', async () => {
      render(<ResetPasswordPage />);

      await waitFor(() => {
        expect(screen.getByText('Enlace inválido')).toBeInTheDocument();
      });
    });
  });
});
