"use client";
import { ConnectButton } from '@rainbow-me/rainbowkit';
import IPGatekeeper from '@/components/IPGatekeeper';

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50 text-gray-900">
      <div className="max-w-4xl mx-auto px-6 py-10 space-y-8">
        
        {/* Header */}
        <header className="flex justify-between items-center">
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
            IP Gatekeeper
          </h1>
          <ConnectButton />
        </header>

        {/* Content Card */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:p-8 space-y-4">
          <IPGatekeeper />
        </section>

        {/* Optional Footer or Info */}
        <footer className="text-sm text-gray-500 text-center">
          Built with ❤️ using Story Protocol
        </footer>

      </div>
    </main>
  );
}
