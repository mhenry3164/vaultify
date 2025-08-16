'use client';

import { useAuth } from '@/hooks/useAuth';
import { useAssets } from '@/hooks/useAssets';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { ProcessAnimation } from '@/components/dashboard/ProcessAnimation';
import { Shield } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import Link from 'next/link';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const { assets, loading, getTotalValue } = useAssets();

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black flex items-center justify-center">
        <div className="text-center">
          <p className="text-white mb-4">Please log in to access the dashboard.</p>
          <Link href="/login">
            <Button>Go to Login</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-elegant">
      {/* Header */}
      <header className="bg-elegant-900/80 backdrop-blur-md border-b border-elegant-800/50">
        <div className="max-w-md mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-gold rounded-lg flex items-center justify-center shadow-gold-glow/50">
                <Shield className="w-5 h-5 text-black" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Snap My Assets</h1>
                <p className="text-xs text-gray-400">by Vaultify</p>
              </div>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={logout}
              className="text-gray-400 hover:text-white"
            >
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-md mx-auto px-6 py-8">
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">Welcome back!</h2>
            <p className="text-elegant-400">Ready to catalog your assets?</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-gold-400">
                  {loading ? '...' : assets.length}
                </div>
                <div className="text-xs text-elegant-400">Items</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-gold-400">
                  {loading ? '...' : formatCurrency(getTotalValue())}
                </div>
                <div className="text-xs text-elegant-400">Total Value</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-gold-400">0</div>
                <div className="text-xs text-elegant-400">Gaps Found</div>
              </CardContent>
            </Card>
          </div>

          {/* Animated Process Cards */}
          <ProcessAnimation />
        </div>
      </main>
    </div>
  );
}