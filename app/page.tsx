"use client";
import { ConnectButton } from '@rainbow-me/rainbowkit';
import IPGatekeeper from '@/components/IPGatekeeper';

export default function Home() {
  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-gray-50 via-white to-gray-100">
      {/* 3D Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Floating geometric shapes */}
        <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-br from-white to-gray-200 rounded-2xl shadow-2xl transform rotate-12 animate-pulse opacity-40"></div>
        <div className="absolute top-60 right-20 w-24 h-24 bg-gradient-to-tl from-gray-100 to-white rounded-full shadow-xl transform -rotate-6 animate-bounce opacity-30" style={{animationDuration: '3s'}}></div>
        <div className="absolute bottom-40 left-1/4 w-40 h-40 bg-gradient-to-r from-white to-gray-150 rounded-3xl shadow-2xl transform rotate-45 animate-pulse opacity-25" style={{animationDelay: '1s'}}></div>
        <div className="absolute bottom-20 right-10 w-28 h-28 bg-gradient-to-bl from-gray-50 to-white rounded-xl shadow-lg transform -rotate-12 animate-bounce opacity-35" style={{animationDuration: '4s', animationDelay: '0.5s'}}></div>
        
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: `linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)`,
          backgroundSize: '50px 50px'
        }}></div>
        
        {/* Subtle light rays */}
        <div className="absolute top-0 left-1/4 w-px h-full bg-gradient-to-b from-transparent via-gray-200 to-transparent opacity-20 transform rotate-12"></div>
        <div className="absolute top-0 right-1/3 w-px h-full bg-gradient-to-b from-transparent via-gray-200 to-transparent opacity-20 transform -rotate-12"></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-4xl">
          {/* Header with enhanced styling */}
          <div className="flex justify-between items-center mb-8 p-6 bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-800 via-gray-700 to-gray-900 bg-clip-text text-transparent drop-shadow-sm">
              IP Gatekeeper
            </h1>
            <div className="transform hover:scale-105 transition-transform duration-200">
              <ConnectButton />
            </div>
          </div>
          
          {/* IPGatekeeper with enhanced container */}
          <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-2xl border border-white/30 p-8 transform hover:scale-[1.02] transition-all duration-300">
            <IPGatekeeper />
          </div>
        </div>
      </div>

      {/* Additional ambient effects */}
      <div className="absolute top-1/4 left-1/2 transform -translate-x-1/2 w-96 h-96 bg-gradient-radial from-white/30 to-transparent rounded-full blur-3xl opacity-50 animate-pulse" style={{animationDuration: '6s'}}></div>
    </div>
  );
}
