"use client";
import { ConnectButton } from '@rainbow-me/rainbowkit';
import IPGatekeeper from '@/components/IPGatekeeper';

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <div className="w-full max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-6">IP Gatekeeper</h1>
          <div className="flex justify-center mb-8">
            <ConnectButton />
          </div>
        </div>
        
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <IPGatekeeper />
        </div>
      </div>
    </main>
  );
}
