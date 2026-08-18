import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "./styles/tokens.css";
import QuickDock from "./QuickDock";
import CookieConsent from "./CookieConsent";

const geistSans = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "RF Echelon — Portal",
  description: "Portal do servidor RF Echelon: download, doações e fórum da comunidade.",
  other: {
    "codex-preview": "development",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <a className="skip-link" href="#conteudo">Pular para o conteúdo</a>
        {children}
        <QuickDock />
        <CookieConsent />
      </body>
    </html>
  );
}
