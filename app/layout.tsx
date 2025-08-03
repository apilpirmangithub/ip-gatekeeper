import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Web3Providers from "@/providers/Web3Providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "IP Gatekeeper",
  description: "AI-powered IP asset registration with Story Protocol",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Web3Providers>
          {children}
        </Web3Providers>
      </body>
    </html>
  );
}
