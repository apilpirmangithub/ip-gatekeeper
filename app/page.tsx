"use client";
import { ConnectButton } from '@rainbow-me/rainbowkit';
import IPGatekeeperCartoon from '@/components/IPGatekeeperCartoon';
import { Shield, Sparkles, Zap, Lock, Eye } from 'lucide-react';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Animated Background Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(139,92,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(139,92,246,0.03)_1px,transparent_1px)] bg-[size:50px_50px] animate-pulse"></div>
      
      {/* Floating Orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-purple-500/30 to-pink-500/30 rounded-full mix-blend-multiply filter blur-3xl animate-float"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-br from-blue-500/30 to-cyan-500/30 rounded-full mix-blend-multiply filter blur-3xl animate-float" style={{animationDelay: '2s'}}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-float" style={{animationDelay: '4s'}}></div>
      </div>

      <div className="relative z-10 min-h-screen flex flex-col">
        
        {/* Navigation Header */}
        <nav className="p-6">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-pulse"></div>
                <div className="relative bg-slate-900 rounded-full p-3 border border-purple-500/50">
                  <Shield className="w-8 h-8 text-purple-400" />
                  <Sparkles className="w-3 h-3 text-yellow-400 absolute -top-1 -right-1 animate-pulse" />
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
                  IP Gatekeeper
                </h1>
                <p className="text-xs text-gray-400 font-medium">Powered by Story Protocol</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-6">
              <div className="hidden md:flex items-center space-x-6 text-sm text-gray-300">
                <div className="flex items-center space-x-2 hover:text-purple-400 transition-colors cursor-pointer">
                  <Eye className="w-4 h-4" />
                  <span>AI Detection</span>
                </div>
                <div className="flex items-center space-x-2 hover:text-purple-400 transition-colors cursor-pointer">
                  <Lock className="w-4 h-4" />
                  <span>IP Protection</span>
                </div>
                <div className="flex items-center space-x-2 hover:text-purple-400 transition-colors cursor-pointer">
                  <Zap className="w-4 h-4" />
                  <span>Instant Registry</span>
                </div>
              </div>
              <div className="transform hover:scale-105 transition-transform duration-200">
                <ConnectButton />
              </div>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <div className="flex-1 flex items-center justify-center px-6 py-12">
          <div className="max-w-6xl mx-auto">
            
            {/* Hero Content */}
            <div className="text-center mb-16 space-y-6">
              <div className="inline-flex items-center space-x-2 bg-purple-500/10 backdrop-blur-sm border border-purple-500/20 rounded-full px-6 py-2 mb-6">
                <Zap className="w-4 h-4 text-purple-400" />
                <span className="text-sm font-semibold text-purple-300">AI-Powered IP Protection</span>
              </div>
              
              <h2 className="text-5xl md:text-7xl font-bold leading-tight">
                <span className="bg-gradient-to-r from-white via-purple-200 to-white bg-clip-text text-transparent">
                  Protect Your
                </span>
                <br />
                <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent animate-shimmer">
                  Creative Assets
                </span>
              </h2>
              
              <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
                Advanced AI detection meets blockchain security. Register, protect, and monetize your intellectual property with confidence on Story Protocol.
              </p>

              <div className="flex flex-wrap justify-center gap-4 mt-8">
                <div className="flex items-center space-x-2 bg-green-500/10 backdrop-blur-sm border border-green-500/20 rounded-full px-4 py-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-sm font-semibold text-green-300">AI Detection Ready</span>
                </div>
                <div className="flex items-center space-x-2 bg-blue-500/10 backdrop-blur-sm border border-blue-500/20 rounded-full px-4 py-2">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                  <span className="text-sm font-semibold text-blue-300">Blockchain Secured</span>
                </div>
                <div className="flex items-center space-x-2 bg-purple-500/10 backdrop-blur-sm border border-purple-500/20 rounded-full px-4 py-2">
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                  <span className="text-sm font-semibold text-purple-300">Instant Registration</span>
                </div>
              </div>
            </div>

            {/* Main Application Card */}
            <div className="relative group">
              {/* Glow Effect */}
              <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 rounded-3xl blur-xl opacity-25 group-hover:opacity-40 transition duration-1000"></div>
              
              {/* Main Card */}
              <div className="relative bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl overflow-hidden">
                {/* Card Header */}
                <div className="bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-blue-500/10 border-b border-white/10 p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                      <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                      <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                    </div>
                    <div className="text-sm text-gray-400 font-mono">
                      ip-gatekeeper.app
                    </div>
                  </div>
                </div>
                
                {/* Application Content */}
<div className="p-8">
  <IPGatekeeperCartoon />
</div>

            {/* Features Grid */}
            <div className="grid md:grid-cols-3 gap-6 mt-16">
              <div className="group bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6 hover:bg-white/10 transition-all duration-300 hover:scale-105">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Eye className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">AI Detection</h3>
                <p className="text-gray-400 text-sm">Advanced algorithms detect AI-generated content with high accuracy and confidence scoring.</p>
              </div>
              
              <div className="group bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6 hover:bg-white/10 transition-all duration-300 hover:scale-105">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Lock className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Blockchain Security</h3>
                <p className="text-gray-400 text-sm">Immutable registration on Story Protocol ensures your IP rights are permanently protected.</p>
              </div>
              
              <div className="group bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6 hover:bg-white/10 transition-all duration-300 hover:scale-105">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Smart Licensing</h3>
                <p className="text-gray-400 text-sm">Flexible licensing options with automated royalty distribution and usage tracking.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="border-t border-white/10 bg-slate-900/50 backdrop-blur-sm p-6">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-sm text-gray-400">
              © 2025 IP Gatekeeper. Powered by Story Protocol.
            </div>
            <div className="flex items-center space-x-6 text-sm text-gray-400">
              <a href="#" className="hover:text-purple-400 transition-colors">Documentation</a>
              <a href="#" className="hover:text-purple-400 transition-colors">API</a>
              <a href="#" className="hover:text-purple-400 transition-colors">Support</a>
            </div>
          </div>
        </footer>
      </div>
    </main>
  );
}
