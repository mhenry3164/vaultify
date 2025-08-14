'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { LoginForm } from '@/components/auth/LoginForm';
import { Shield, Camera, List, FileText, LogOut } from 'lucide-react';

export default function Home() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('upload');

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-yellow-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!user) {
    return <LoginForm />;
  }

  const tabs = [
    { id: 'upload', label: 'Upload', icon: Camera, href: '/upload' },
    { id: 'inventory', label: 'Inventory', icon: List, href: '/inventory' },
    { id: 'policy', label: 'Policy', icon: FileText, href: '/policy' }
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Header */}
      <header className="bg-surface/80 backdrop-blur-sm border-b border-border/10 px-6 py-4 flex items-center justify-between safe-top">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center">
            <Shield className="w-5 h-5 text-accent-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-semibold">Asset Snap</h1>
            <p className="text-xs text-muted">by Vaultify</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="p-2 hover:bg-surface-hover rounded-full transition-all active:scale-95 flex items-center gap-2 text-muted-foreground"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Tab Navigation */}
        <nav className="bg-surface px-6 py-3 border-b border-border/10">
          <div className="flex space-x-1 bg-background/50 backdrop-blur-sm rounded-xl p-1 shadow-sm">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  router.push(tab.href);
                }}
                className={`flex-1 flex items-center justify-center space-x-2 py-2 px-4 rounded-xl transition-all ${
                  activeTab === tab.id
                    ? 'bg-accent text-accent-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-surface-hover'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span className="text-sm font-medium">{tab.label}</span>
              </button>
            ))}
          </div>
        </nav>

        {/* Content Area */}
        <div className="flex-1 px-6 py-8">
          {activeTab === 'upload' && (
            <div className="space-y-8 max-w-md mx-auto">
              <div className="text-center">
                <h2 className="text-2xl font-bold mb-2">Capture Assets</h2>
                <p className="text-muted mb-6">
                  Snap photos of your valuables.<br />
                  AI handles identification & valuation.
                </p>
              </div>

              {/* Main Upload Area */}
              <div 
                onClick={() => router.push('/upload')}
                className="bg-surface border border-dashed border-border rounded-3xl p-8 text-center cursor-pointer hover:border-accent hover:bg-surface-hover transition-all active:scale-[0.99]"
              >
                <div className="w-16 h-16 bg-accent rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Camera className="w-8 h-8 text-accent-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Tap to capture or upload</h3>
                <p className="text-muted text-sm">
                  Photos, receipts, or documentation<br />
                  Up to 10MB • JPG, PNG, PDF
                </p>
              </div>

              {/* Features */}
              <div className="bg-surface border border-border/10 rounded-3xl p-6 shadow-sm">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
                    <span className="text-accent-foreground text-sm font-bold">AI</span>
                  </div>
                  <h3 className="text-lg font-semibold text-accent">AI-Powered Processing</h3>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                    <span className="text-foreground text-sm">Instant classification & categorization</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                    <span className="text-foreground text-sm">Market-based value estimation</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                    <span className="text-foreground text-sm">Serial number & model detection</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                    <span className="text-foreground text-sm">Coverage gap analysis</span>
                  </div>
                </div>
              </div>

              {/* Tips */}
              <div className="bg-surface border border-border/10 rounded-3xl p-6 shadow-sm">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-xs">💡</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground mb-2">Best results with clear, well-lit photos showing full item detail</h4>
                    <div className="flex flex-wrap gap-2">
                      <span className="px-3 py-1 bg-background rounded-full text-xs text-accent">Electronics</span>
                      <span className="px-3 py-1 bg-background rounded-full text-xs text-accent">Jewelry</span>
                      <span className="px-3 py-1 bg-background rounded-full text-xs text-accent">Art & Collectibles</span>
                      <span className="px-3 py-1 bg-background rounded-full text-xs text-accent">Appliances</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* CTA */}
              <button 
                onClick={() => router.push('/upload')}
                className="w-full h-14 text-lg font-bold bg-accent text-accent-foreground rounded-2xl flex items-center justify-center gap-2 transition-all hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.98]"
              >
                <Camera className="w-5 h-5" />
                Start Camera
              </button>
            </div>
          )}

          {activeTab === 'inventory' && (
            <div className="text-center py-12 max-w-md mx-auto">
              <List className="w-16 h-16 text-muted mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Your Inventory</h3>
              <p className="text-muted mb-6">Add some assets to see them here</p>
              <button 
                onClick={() => {
                  setActiveTab('upload');
                  router.push('/upload');
                }}
                className="px-6 py-3 bg-accent text-accent-foreground rounded-xl flex items-center justify-center gap-2 transition-all hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.98] mx-auto"
              >
                <Camera className="w-5 h-5" />
                Upload Your First Asset
              </button>
            </div>
          )}

          {activeTab === 'policy' && (
            <div className="text-center py-12 max-w-md mx-auto">
              <FileText className="w-16 h-16 text-muted mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Policy Analysis</h3>
              <p className="text-muted mb-6">Upload your insurance policy to find coverage gaps</p>
              <button 
                onClick={() => router.push('/policy')}
                className="px-6 py-3 bg-accent text-accent-foreground rounded-xl flex items-center justify-center gap-2 transition-all hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.98] mx-auto"
              >
                <FileText className="w-5 h-5" />
                Upload Policy
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
