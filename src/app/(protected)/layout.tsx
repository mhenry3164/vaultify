'use client';

import { AuthProvider } from '@/hooks/useAuth';
import { BackgroundProcessingIndicator } from '@/components/upload/BackgroundProcessingIndicator';

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      {children}
      <BackgroundProcessingIndicator />
    </AuthProvider>
  );
}