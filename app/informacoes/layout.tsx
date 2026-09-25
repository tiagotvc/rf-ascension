import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import HeaderAuth from "../HeaderAuth";
import { siteConfig } from "../config/site";
import DocsSidebar from "./DocsSidebar";
import { docsNav } from "./nav";

export const metadata: Metadata = {
  title: { default: "Documentação — RF Echelon", template: "%s — Documentação RF Echelon" },
  description: "Informações oficiais do RF Echelon: classes, skills e sistemas do servidor.",
};

export default function InformacoesLayout({ children }: { children: ReactNode }) {
  return (
    <div className="doc-shell">
      <header className="doc-topbar">
        <Link href="/" className="brand" aria-label="RF Echelon - início">
          <span className="brand-mark">RF</span>
          <span className="brand-copy">
            <strong>ECHELON</strong>
            <small>DOCUMENTAÇÃO</small>
          </span>
        </Link>
        <nav aria-label="Navegação principal">
          <Link href="/">Início</Link>
          <Link href="/#download">Baixar</Link>
          <Link href="/forum">Fórum</Link>
          <Link href="/gamecp">Game CP</Link>
        </nav>
        <div className="doc-topbar-tools">
          <span className="doc-launch">
            ABERTURA <b>{siteConfig.launchLabel}</b>
          </span>
          <HeaderAuth />
        </div>
      </header>
      <div className="doc-body">
        <DocsSidebar root={docsNav.root} groups={docsNav.groups} />
        <main className="doc-main">{children}</main>
      </div>
    </div>
  );
}
