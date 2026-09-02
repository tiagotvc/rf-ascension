"use client";
import { useEffect, useRef, useState } from "react";

// Indicador de sessão de jogador no header — aparece em todas as telas do
// site (não só /gamecp). Client component porque a maioria dos headers do
// site são markup estático inline (não dá pra virar toda página em server
// component só por causa disso); busca a sessão via /api/store/me (sem
// efeito colateral, só lê o cookie assinado).
export default function HeaderAuth({ locale = "pt" }: { locale?: "pt" | "en" }) {
  const [username, setUsername] = useState<string | null | undefined>(undefined);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
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

  useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  async function handleLogout() {
    await fetch("/api/store/logout", { method: "POST" });
    window.location.href = locale === "en" ? "/en" : "/";
  }

  if (username) {
    return (
      <div className="header-auth" ref={rootRef}>
        <button className="header-avatar" onClick={() => setOpen((o) => !o)} type="button" aria-expanded={open}>
          {username.charAt(0).toUpperCase()}
        </button>
        {open && (
          <div className="header-auth-menu">
            <span className="header-auth-menu-name">{username}</span>
            <a href={gamecpHref}>Game CP</a>
            <button onClick={handleLogout} type="button">
              {locale === "en" ? "Log out" : "Sair"}
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <a className="header-cta" href={gamecpHref}>
      {locale === "en" ? "Create account" : "Criar conta"} <span>↗</span>
    </a>
  );
}
