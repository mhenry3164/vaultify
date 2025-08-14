'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Shield, CheckCircle } from 'lucide-react';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await login(email, password);
    } catch (err) {
      setError('Invalid email or password');
    } finally {
      setIsLoading(false);
    }
  };

  const fillDemoAccount = () => {
    setEmail('demo1@snapmyassets.com');
    setPassword('DemoAccount1!');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-950 via-dark-900 to-dark-800 flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="w-24 h-24 mx-auto mb-8 bg-gradient-to-br from-[#ffd700] via-[#ffe699] to-[#ffcc00] rounded-3xl flex items-center justify-center shadow-2xl animate-pulse-glow">
            <Shield className="w-12 h-12 text-black" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-4 tracking-tight">Get early access</h1>
          <p className="text-gray-400 text-xl leading-relaxed px-4">Join the MVP waitlist. We'll only email important updates—no spam.</p>
        </div>

        {/* Main Form Card */}
        <div className="bg-gradient-to-br from-dark-800 to-dark-800/80 border border-gray-700/50 rounded-3xl p-10 shadow-2xl backdrop-blur-sm">
          <form onSubmit={handleSubmit} className="space-y-8">
            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-sm">
                {error}
              </div>
            )}
            
            <div className="grid grid-cols-1 gap-8">
              <div>
                <label className="block text-base font-semibold text-gray-300 mb-4">
                  Email <span className="text-primary-400">*</span>
                </label>
                <Input
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-16 text-lg px-6 rounded-2xl border-2"
                />
              </div>
              
              <div>
                <label className="block text-base font-semibold text-gray-300 mb-4">
                  Password <span className="text-primary-400">*</span>
                </label>
                <Input
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-16 text-lg px-6 rounded-2xl border-2"
                />
              </div>
            </div>

            {/* Agreement Checkbox */}
            <div className="flex items-start space-x-4 pt-4">
              <div className="flex items-center h-6 mt-0.5">
                <CheckCircle className="w-6 h-6 text-primary-400" />
              </div>
              <p className="text-base text-gray-300 leading-relaxed">
                I agree to receive product updates about Asset Snap and understand I can unsubscribe anytime.
              </p>
            </div>
            
            <Button
              type="submit"
              className="w-full h-16 text-xl font-bold bg-gradient-to-r from-[#ffd700] via-[#ffe699] to-[#ffcc00] hover:from-[#ffcc00] hover:to-[#ffd700] text-black shadow-xl hover:shadow-2xl hover:shadow-primary-400/25 transform hover:-translate-y-1 transition-all duration-300 rounded-2xl"
              disabled={isLoading}
            >
              {isLoading ? 'Signing in...' : 'Join the waitlist'}
            </Button>
          </form>
        </div>

        {/* Demo Account Section */}
        <div className="mt-12 bg-gradient-to-r from-primary-400/10 via-primary-400/5 to-primary-400/10 border border-primary-400/20 rounded-3xl p-8 backdrop-blur-sm">
          <div className="flex items-start space-x-4 mb-6">
            <div className="w-8 h-8 bg-primary-400 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
              <CheckCircle className="w-5 h-5 text-black" />
            </div>
            <div>
              <h4 className="text-lg font-bold text-primary-400 mb-3">Demo Account</h4>
              <div className="text-base text-gray-300 space-y-2 mb-6">
                <p className="font-mono bg-dark-800/50 px-4 py-2 rounded-xl">demo1@snapmyassets.com</p>
                <p className="font-mono bg-dark-800/50 px-4 py-2 rounded-xl">Password: DemoAccount1!</p>
              </div>
            </div>
          </div>
          <Button
            variant="secondary"
            onClick={fillDemoAccount}
            className="w-full h-14 border-2 border-primary-400/30 hover:border-primary-400 hover:bg-primary-400/10 text-primary-400 font-bold text-lg transition-all duration-200 rounded-2xl"
          >
            Use Demo Account
          </Button>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-sm text-gray-500">
            <span className="font-semibold text-white">Asset Snap</span> by <span className="text-primary-400">Vaultify</span>
          </p>
        </div>
      </div>
    </div>
  );
}
