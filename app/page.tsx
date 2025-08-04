"use client";
import { ConnectButton } from '@rainbow-me/rainbowkit';
import IPGatekeeper from '@/components/IPGatekeeper';

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-3xl space-y-8">
        
        {/* Header */}
        <header className="flex justify-between items-center bg-white rounded-2xl shadow p-6">
          <h1 className="text-3xl font-bold text-gray-800">IP Gatekeeper</h1>
          <ConnectButton />
        </header>

        {/* Main content */}
        <section className="bg-white rounded-2xl shadow p-6 animate-fadeIn">
          <IPGatekeeper />
        </section>
      </div>
    </main>
  );
}

