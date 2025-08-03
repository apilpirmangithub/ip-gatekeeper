// Update app/page.tsx dengan style mirip Story
"use client";
import { ConnectButton } from '@rainbow-me/rainbowkit';
import IPGatekeeper from '@/components/IPGatekeeper';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">IP Gatekeeper</h1>
          <p className="text-xl text-gray-600 mb-8">AI-powered IP asset registration with Story Protocol</p>
          <div className="flex justify-center">
            <ConnectButton />
          </div>
        </div>
        
        <div className="max-w-4xl mx-auto">
          <IPGatekeeper />
        </div>
      </div>
    </div>
  );
}
