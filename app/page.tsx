"use client";
import { ConnectButton } from '@rainbow-me/rainbowkit';
import IPGatekeeper from '@/components/IPGatekeeper';
import { Shield, Sparkles } from 'lucide-react';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 px-4 py-8">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse-slow"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse-slow" style={{animationDelay: '2s'}}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse-slow" style={{animationDelay: '4s'}}></div>
      </div>

      <div className="relative z-10 max-w-4xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex justify-between items-center bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl p-6">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Shield className="w-10 h-10 text-purple-400" />
              <Sparkles className="w-4 h-4 text-yellow-400 absolute -top-1 -right-1 animate-pulse" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
                IP Gatekeeper
              </h1>
              <p className="text-sm text-gray-300 font-medium">AI-Powered IP Protection</p>
            </div>
          </div>
          <div className="transform hover:scale-105 transition-transform duration-200">
            <ConnectButton />
          </div>
        </div>

        {/* Main content */}
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl p-8">
          <IPGatekeeper />
        </div>
      </div>
    </main>
  );
}


