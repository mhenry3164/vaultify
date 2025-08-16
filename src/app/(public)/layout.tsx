'use client';

import { AuthProvider } from '@/hooks/useAuth';

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthProvider>{children}</AuthProvider>;
}