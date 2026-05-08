import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Onchain RiskGuard Skill",
  description: "Protective trading skill for OKX Agentic Wallet and OnchainOS.",
  icons: {
    icon: "/favicon.svg"
  }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
