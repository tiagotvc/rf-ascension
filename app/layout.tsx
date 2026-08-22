import type { Metadata } from "next";
import { Geist, Geist_Mono, Cinzel, Newsreader, JetBrains_Mono } from "next/font/google";
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

// Só usadas dentro do fórum (.forum-page) — ver globals.css. Carregadas aqui
// porque next/font só resolve no root layout, mas o arquivo de fonte real só
// baixa se alguma regra CSS de fato usar a variável, então páginas fora do
// fórum não pagam nada por isso.
const cinzel = Cinzel({ variable: "--font-cinzel", subsets: ["latin"], weight: ["500", "600", "700"] });
const newsreader = Newsreader({ variable: "--font-newsreader", subsets: ["latin"], style: ["normal", "italic"] });
const jetbrainsMono = JetBrains_Mono({ variable: "--font-jetbrains-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "RF Echelon — Portal",
  description: "Portal do servidor RF Echelon: download, doações e fórum da comunidade.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${cinzel.variable} ${newsreader.variable} ${jetbrainsMono.variable} antialiased`}
      >
        <a className="skip-link" href="#conteudo">Pular para o conteúdo</a>
        {children}
        <QuickDock />
        <CookieConsent />
      </body>
    </html>
  );
}
