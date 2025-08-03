"use client";
import { ConnectButton } from '@rainbow-me/rainbowkit';
import IPGatekeeper from '@/components/IPGatekeeper';

export default function Home() {
  return (
    <main className="min-h-screen p-4 bg-gray-50">
      <div className="w-full max-w-4xl mx-auto">
        {/* Header dengan wallet terpisah */}
        <div className="flex justify-between items-center mb-8 bg-white rounded-2xl shadow-lg p-6">
          <h1 className="text-4xl font-bold text-gray-800">IP Gatekeeper</h1>
          <ConnectButton />
        </div>
        
        {/* Main content */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <IPGatekeeper />
        </div>
      </div>
    </main>
  );
}
