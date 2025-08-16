import Link from 'next/link'
import { Shield, Camera, AlertTriangle, Users } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black">
      {/* Header */}
      <header className="px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-yellow-400 to-yellow-300 rounded-lg flex items-center justify-center">
              <Shield className="w-6 h-6 text-black" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Snap My Assets</h1>
              <p className="text-xs text-gray-400">by Vaultify</p>
            </div>
          </div>
          
          <Link 
            href="/login" 
            className="bg-gradient-to-r from-yellow-400 to-yellow-300 text-black px-6 py-2 rounded-2xl font-semibold hover:shadow-lg transition-all hover:-translate-y-0.5"
          >
            Get Started
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="px-6 py-12">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-4xl md:text-6xl font-bold text-white mb-6">
            Cover Your Assets.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-300">
              Automatically.
            </span>
          </h2>
          
          <p className="text-xl text-gray-300 mb-12 max-w-2xl mx-auto">
            AI-powered household inventory that identifies insurance coverage gaps 
            and protects what matters most to you.
          </p>

          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {/* Step 1 */}
            <div className="bg-gray-800 rounded-2xl p-8 border border-gray-700">
              <div className="w-16 h-16 bg-gradient-to-r from-yellow-400 to-yellow-300 rounded-full flex items-center justify-center mx-auto mb-4">
                <Camera className="w-8 h-8 text-black" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Photo → Value</h3>
              <p className="text-gray-400">
                Simply snap photos of your belongings. Our AI instantly identifies 
                items and estimates their replacement value.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-gray-800 rounded-2xl p-8 border border-gray-700">
              <div className="w-16 h-16 bg-gradient-to-r from-yellow-400 to-yellow-300 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-black" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Policy Gap Alerts</h3>
              <p className="text-gray-400">
                Upload your insurance policy. We analyze your coverage limits 
                against your actual inventory value.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-gray-800 rounded-2xl p-8 border border-gray-700">
              <div className="w-16 h-16 bg-gradient-to-r from-yellow-400 to-yellow-300 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-black" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Carrier-First</h3>
              <p className="text-gray-400">
                Get personalized recommendations to optimize your coverage 
                with your existing insurance carrier.
              </p>
            </div>
          </div>

          <Link 
            href="/login" 
            className="inline-block bg-gradient-to-r from-yellow-400 to-yellow-300 text-black px-12 py-4 rounded-2xl text-lg font-semibold hover:shadow-lg transition-all hover:-translate-y-0.5"
          >
            Get Early Access
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-6 py-8 border-t border-gray-800">
        <div className="max-w-6xl mx-auto text-center text-gray-400">
          <p>&copy; 2024 Vaultify. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}