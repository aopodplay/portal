// app/layout.tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import { PlayerProvider } from '@/contexts/PlayerContext';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'PodFéPlay',
  description: 'Música gospel, pregações, podcasts e conteúdos bíblicos',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt">
      <body className={inter.className}>
        <AuthProvider>
          <PlayerProvider>
            {children}
          </PlayerProvider>
        </AuthProvider>
      </body>
    </html>
  );
}