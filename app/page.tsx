"use client";
import { ConnectButton } from '@rainbow-me/rainbowkit';
import IPGatekeeper from '@/components/IPGatekeeper';

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-4xl">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">IP Gatekeeper</h1>
          <ConnectButton />
        </div>
        <IPGatekeeper />
      </div>
    </div>
  );
}
