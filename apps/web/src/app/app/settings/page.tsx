'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Header } from '@/components/layout';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Button,
  Input,
  Select,
} from '@/components/ui';
import { auth } from '@/lib/api';
import { User, GraduationCap, BookOpen, Sparkles, Save } from 'lucide-react';
import {
  studyStyleLabels,
  contentDepthLabels,
} from '@/lib/utils';

export default function SettingsPage() {
  const { user, token, refreshUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [profile, setProfile] = useState({
    firstName: user?.profile?.firstName || '',
    lastName: user?.profile?.lastName || '',
    career: user?.profile?.career || '',
    year: user?.profile?.year?.toString() || '',
    university: user?.profile?.university || '',
    studyStyle: user?.profile?.studyStyle || 'BALANCED',
    contentDepth: user?.profile?.contentDepth || 'INTERMEDIATE',
    preferredLang: user?.profile?.preferredLang || 'es',
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;

    setIsLoading(true);
    setMessage(null);

    try {
      await auth.updateProfile(token, {
        ...profile,
        year: profile.year ? parseInt(profile.year) : null,
      });
      await refreshUser();
      setMessage({ type: 'success', text: 'Perfil actualizado correctamente' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Error al actualizar el perfil' });
    } finally {
      setIsLoading(false);
    }
  }

  const yearOptions = [
    { value: '', label: 'No especificado' },
    { value: '1', label: '1er año' },
    { value: '2', label: '2do año' },
    { value: '3', label: '3er año' },
    { value: '4', label: '4to año' },
    { value: '5', label: '5to año' },
    { value: '6', label: '6to año o más' },
  ];

  const studyStyleOptions = Object.entries(studyStyleLabels).map(([value, label]) => ({
    value,
    label,
  }));

  const contentDepthOptions = Object.entries(contentDepthLabels).map(([value, label]) => ({
    value,
    label,
  }));

  const languageOptions = [
    { value: 'es', label: 'Español' },
    { value: 'en', label: 'Inglés' },
    { value: 'pt', label: 'Portugués' },
  ];

  return (
    <>
      <Header
        title="Configuración"
        subtitle="Personaliza tu experiencia de estudio"
      />

      <div className="p-6 max-w-3xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          {message && (
            <div
              className={`p-4 rounded-lg ${
                message.type === 'success'
                  ? 'bg-green-50 text-green-700 border border-green-200'
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}
            >
              {message.text}
            </div>
          )}

          {/* Personal Info */}
          <Card>
            <CardHeader className="p-6 pb-4">
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Información Personal
              </CardTitle>
              <CardDescription>
                Tu información básica de perfil
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 pt-0 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Nombre"
                  value={profile.firstName}
                  onChange={(e) =>
                    setProfile((prev) => ({ ...prev, firstName: e.target.value }))
                  }
                />
                <Input
                  label="Apellido"
                  value={profile.lastName}
                  onChange={(e) =>
                    setProfile((prev) => ({ ...prev, lastName: e.target.value }))
                  }
                />
              </div>
              <Input
                label="Email"
                value={user?.email || ''}
                disabled
                hint="El email no se puede cambiar"
              />
            </CardContent>
          </Card>

          {/* Academic Info */}
          <Card>
            <CardHeader className="p-6 pb-4">
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5" />
                Información Académica
              </CardTitle>
              <CardDescription>
                Datos sobre tu carrera y universidad
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 pt-0 space-y-4">
              <Input
                label="Universidad"
                placeholder="Ej: Universidad de Buenos Aires"
                value={profile.university}
                onChange={(e) =>
                  setProfile((prev) => ({ ...prev, university: e.target.value }))
                }
              />
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Carrera"
                  placeholder="Ej: Ingeniería en Sistemas"
                  value={profile.career}
                  onChange={(e) =>
                    setProfile((prev) => ({ ...prev, career: e.target.value }))
                  }
                />
                <Select
                  label="Año de cursada"
                  options={yearOptions}
                  value={profile.year}
                  onChange={(e) =>
                    setProfile((prev) => ({ ...prev, year: e.target.value }))
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Study Preferences */}
          <Card>
            <CardHeader className="p-6 pb-4">
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                Preferencias de Estudio
              </CardTitle>
              <CardDescription>
                Personaliza cómo el copiloto genera respuestas y resúmenes
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 pt-0 space-y-4">
              <Select
                label="Estilo de estudio"
                options={studyStyleOptions}
                value={profile.studyStyle}
                onChange={(e) =>
                  setProfile((prev) => ({ ...prev, studyStyle: e.target.value as 'FORMAL' | 'PRACTICAL' | 'BALANCED' }))
                }
                hint="Formal: más académico y teórico. Práctico: más ejemplos y aplicaciones."
              />
              <Select
                label="Profundidad del contenido"
                options={contentDepthOptions}
                value={profile.contentDepth}
                onChange={(e) =>
                  setProfile((prev) => ({ ...prev, contentDepth: e.target.value as 'BASIC' | 'INTERMEDIATE' | 'ADVANCED' }))
                }
                hint="Ajusta el nivel de detalle de las explicaciones"
              />
              <Select
                label="Idioma preferido"
                options={languageOptions}
                value={profile.preferredLang}
                onChange={(e) =>
                  setProfile((prev) => ({ ...prev, preferredLang: e.target.value }))
                }
                hint="Idioma en que se generarán los resúmenes y respuestas"
              />
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button
              type="submit"
              isLoading={isLoading}
              leftIcon={<Save className="h-4 w-4" />}
            >
              Guardar cambios
            </Button>
          </div>
        </form>
      </div>
    </>
  );
}
