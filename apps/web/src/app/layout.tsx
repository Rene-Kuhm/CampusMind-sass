import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'CampusMind - Copiloto Académico',
  description: 'Tu copiloto académico integral para universitarios. Busca, organiza y aprende con inteligencia artificial.',
  keywords: ['universidad', 'estudios', 'IA', 'resúmenes', 'académico', 'copiloto'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className={inter.className}>
        {children}
      </body>
    </html>
  );
}
