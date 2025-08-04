"use client";
import { ConnectButton } from '@rainbow-me/rainbowkit';
import IPGatekeeper from '@/components/IPGatekeeper';

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-2xl space-y-8">
        
        {/* Header */}
        <div className="flex justify-between items-center bg-white rounded-2xl shadow p-6">
          <h1 className="text-3xl font-bold text-gray-800">IP Gatekeeper</h1>
          <ConnectButton />
        </div>

        {/* Main content */}
        <div className="bg-white rounded-2xl shadow p-6">
          <IPGatekeeper />
        </div>
      </div>
    </main>
  );
}

