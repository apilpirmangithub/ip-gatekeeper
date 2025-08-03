"use client";
import { ConnectButton } from '@rainbow-me/rainbowkit';
import IPGatekeeper from '@/components/IPGatekeeper';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 relative overflow-hidden">
      {/* Story-inspired background elements */}
      <div className="absolute inset-0">
        {/* Geometric patterns inspired by Story's design */}
        <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-br from-blue-100 to-indigo-200 rounded-2xl opacity-30 transform rotate-12 animate-pulse"></div>
        <div className="absolute top-60 right-20 w-24 h-24 bg-gradient-to-tl from-purple-100 to-blue-200 rounded-full opacity-25 transform -rotate-6 animate-bounce" style={{animationDuration: '3s'}}></div>
        <div className="absolute bottom-40 left-1/4 w-40 h-40 bg-gradient-to-r from-indigo-100 to-blue-100 rounded-3xl opacity-20 transform rotate-45 animate-pulse" style={{animationDelay: '1s'}}></div>
        
        {/* Story Protocol inspired grid */}
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: `linear-gradient(rgba(59, 130, 246, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(59, 130, 246, 0.1) 1px, transparent 1px)`,
          backgroundSize: '60px 60px'
        }}></div>
      </div>

      {/* Main content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-6xl mx-auto">
          {/* Header with Story branding */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl mb-6 shadow-lg">
              <span className="text-2xl font-bold text-white">IP</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-900 bg-clip-text text-transparent">
              IP Gatekeeper
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
              AI-powered IP asset registration with <span className="font-semibold text-blue-600">Story Protocol</span>
            </p>
            
            {/* Connect button with Story styling */}
            <div className="flex justify-center mb-8">
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-4 border border-blue-100">
                <ConnectButton />
              </div>
            </div>
          </div>

          {/* Main app container with Story-inspired design */}
          <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-2xl border border-white/50 overflow-hidden">
            {/* Header bar */}
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm">🛡️</span>
                  </div>
                  <h2 className="text-white font-semibold text-lg">Protect Your Creative Work</h2>
                </div>
                <div className="text-white/80 text-sm">
                  Powered by Story Protocol
                </div>
              </div>
            </div>
            
            {/* Content area */}
            <div className="p-8">
              <IPGatekeeper />
            </div>
          </div>

          {/* Footer with Story branding */}
          <div className="text-center mt-12 space-y-4">
            <div className="flex items-center justify-center space-x-6 text-sm text-gray-500">
              <span className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span>Story Protocol Network</span>
              </span>
              <span>•</span>
              <span>Decentralized IP Management</span>
              <span>•</span>
              <span>Proof of Creativity</span>
            </div>
            <p className="text-xs text-gray-400 max-w-2xl mx-auto">
              Built on Story's purpose-built blockchain for intellectual property. 
              Your creative work is protected by real legal contracts and automated on-chain enforcement.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
