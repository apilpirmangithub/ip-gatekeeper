"use client";
import { ConnectButton } from '@rainbow-me/rainbowkit';
import IPGatekeeper from '@/components/IPGatekeeper';

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-gray-50 via-white to-gray-100">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-100 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse"></div>
        <div className="absolute top-3/4 right-1/4 w-64 h-64 bg-purple-100 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse" style={{animationDelay: '2s'}}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-pink-100 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse" style={{animationDelay: '4s'}}></div>
      </div>

      {/* Main content container */}
      <div className="relative z-10 w-full max-w-5xl mx-auto">
        {/* Header section */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
            IP Gatekeeper
          </h1>
          <p className="text-lg text-gray-600 mb-6 max-w-2xl mx-auto">
            AI-powered IP asset registration with Story Protocol
          </p>
          <div className="flex justify-center mb-8">
            <div className="bg-white rounded-2xl shadow-lg p-4 border border-gray-200">
              <ConnectButton />
            </div>
          </div>
        </div>

        {/* Main application container */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/50 p-6 md:p-8">
          <IPGatekeeper />
        </div>

        {/* Footer info */}
        <div className="text-center mt-8 text-sm text-gray-500">
          <p>Powered by Story Protocol • Secure IP Asset Management</p>
        </div>
      </div>
    </div>
  );
}
