'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { Button, Input, Select, Card } from '@/components/ui';
import { Mail, Lock, User, GraduationCap, Building2, AlertCircle } from 'lucide-react';
import { ApiError } from '@/lib/api';

export default function RegisterPage() {
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    career: '',
    year: '',
    university: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    if (formData.password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres');
      return;
    }

    setIsLoading(true);

    try {
      await register({
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        career: formData.career || undefined,
        year: formData.year ? parseInt(formData.year) : undefined,
        university: formData.university || undefined,
      });
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Error al crear la cuenta. Intenta de nuevo.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const yearOptions = [
    { value: '1', label: '1er año' },
    { value: '2', label: '2do año' },
    { value: '3', label: '3er año' },
    { value: '4', label: '4to año' },
    { value: '5', label: '5to año' },
    { value: '6', label: '6to año o más' },
  ];

  return (
    <Card className="w-full max-w-lg" padding="lg">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-secondary-900 mb-2">
          Crea tu cuenta
        </h1>
        <p className="text-secondary-500">
          Comienza a estudiar de forma más inteligente
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-700">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input
            name="firstName"
            label="Nombre"
            placeholder="Juan"
            value={formData.firstName}
            onChange={handleChange}
            leftIcon={<User className="h-5 w-5" />}
            required
          />
          <Input
            name="lastName"
            label="Apellido"
            placeholder="Pérez"
            value={formData.lastName}
            onChange={handleChange}
            required
          />
        </div>

        <Input
          type="email"
          name="email"
          label="Email"
          placeholder="tu@email.com"
          value={formData.email}
          onChange={handleChange}
          leftIcon={<Mail className="h-5 w-5" />}
          required
          autoComplete="email"
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            type="password"
            name="password"
            label="Contraseña"
            placeholder="••••••••"
            value={formData.password}
            onChange={handleChange}
            leftIcon={<Lock className="h-5 w-5" />}
            required
            autoComplete="new-password"
            hint="Mínimo 8 caracteres"
          />
          <Input
            type="password"
            name="confirmPassword"
            label="Confirmar"
            placeholder="••••••••"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
            autoComplete="new-password"
          />
        </div>

        <hr className="my-6 border-secondary-200" />

        <p className="text-sm text-secondary-500 mb-4">
          Información académica (opcional, puedes completarlo después)
        </p>

        <Input
          name="university"
          label="Universidad"
          placeholder="Universidad de Buenos Aires"
          value={formData.university}
          onChange={handleChange}
          leftIcon={<Building2 className="h-5 w-5" />}
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            name="career"
            label="Carrera"
            placeholder="Ingeniería en Sistemas"
            value={formData.career}
            onChange={handleChange}
            leftIcon={<GraduationCap className="h-5 w-5" />}
          />
          <Select
            name="year"
            label="Año"
            value={formData.year}
            onChange={handleChange}
            options={yearOptions}
            placeholder="Seleccionar"
          />
        </div>

        <Button
          type="submit"
          className="w-full"
          size="lg"
          isLoading={isLoading}
        >
          Crear cuenta
        </Button>
      </form>

      <div className="mt-6 text-center text-sm text-secondary-500">
        ¿Ya tienes cuenta?{' '}
        <Link
          href="/login"
          className="text-primary-600 hover:text-primary-700 font-medium"
        >
          Inicia sesión
        </Link>
      </div>

      <p className="mt-4 text-xs text-secondary-400 text-center">
        Al crear una cuenta, aceptas nuestros{' '}
        <Link href="/terms" className="underline hover:text-secondary-600">
          Términos de Servicio
        </Link>{' '}
        y{' '}
        <Link href="/privacy" className="underline hover:text-secondary-600">
          Política de Privacidad
        </Link>
        .
      </p>
    </Card>
  );
}
