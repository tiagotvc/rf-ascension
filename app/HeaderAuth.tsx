"use client";
import { useEffect, useState } from "react";

// Indicador de sessão de jogador no header — aparece em todas as telas do
// site (não só /gamecp). Client component porque a maioria dos headers do
// site são markup estático inline (não dá pra virar toda página em server
// component só por causa disso); busca a sessão via /api/store/me (sem
// efeito colateral, só lê o cookie assinado).
export default function HeaderAuth({ locale = "pt" }: { locale?: "pt" | "en" }) {
  const [username, setUsername] = useState<string | null | undefined>(undefined);
  const gamecpHref = locale === "en" ? "/en/gamecp" : "/gamecp";

  useEffect(() => {
    let cancelled = false;
    fetch("/api/store/me")
      .then((res) => res.json())
      .then((data: { username: string | null }) => {
        if (!cancelled) setUsername(data.username);
      })
      .catch(() => {
        if (!cancelled) setUsername(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleLogout() {
    await fetch("/api/store/logout", { method: "POST" });
    window.location.href = locale === "en" ? "/en" : "/";
  }

  if (username) {
    return (
      <div className="header-auth">
        <a href={gamecpHref} className="header-avatar" title={username}>
          {username.charAt(0).toUpperCase()}
        </a>
        <button className="header-logout" onClick={handleLogout} type="button">
          {locale === "en" ? "Log out" : "Sair"}
        </button>
      </div>
    );
  }

  return (
    <a className="header-cta" href={gamecpHref}>
      {locale === "en" ? "Create account" : "Criar conta"} <span>↗</span>
    </a>
  );
}
