"use client";
import { useState } from "react";

export type AccountCharacter = { serial: number; name: string; level: number; race: number };

const COPY = {
  pt: {
    createTab: "Criar conta",
    loginTab: "Entrar",
    createTitle: "Crie sua conta",
    loginTitle: "Entrar",
    createHint: "Usuário e senha de 4 a 12 caracteres, letras e números, sem espaço ou acento.",
    loginHint: "Use o mesmo usuário e senha que você criou.",
    user: "Usuário",
    pass: "Senha",
    confirmPass: "Confirmar senha",
    footNote: "Mesma conta usada no cliente do jogo.",
    welcome: (u: string) => (
      <>
        Bem-vindo, <em>{u}</em>.
      </>
    ),
    active: "Sua conta está ativa. Baixe o cliente, entre no jogo e escolha sua raça.",
    noChars: "Nenhum personagem criado ainda — entre no jogo pra criar o primeiro.",
    download: "Baixar cliente",
    store: "Loja de doações",
    logout: "Sair da conta",
  },
  en: {
    createTab: "Create account",
    loginTab: "Log in",
    createTitle: "Create your account",
    loginTitle: "Log in",
    createHint: "Username and password 4 to 12 characters, letters and numbers, no spaces or accents.",
    loginHint: "Use the same username and password you created.",
    user: "Username",
    pass: "Password",
    confirmPass: "Confirm password",
    footNote: "Same account used in the game client.",
    welcome: (u: string) => (
      <>
        Welcome, <em>{u}</em>.
      </>
    ),
    active: "Your account is active. Download the client, log in and pick your race.",
    noChars: "No character created yet — log in-game to create your first one.",
    download: "Download client",
    store: "Donation store",
    logout: "Log out",
  },
};

export default function AccountPortal({
  loggedInUsername,
  characters,
  locale = "pt",
}: {
  loggedInUsername: string | null;
  characters: AccountCharacter[];
  locale?: "pt" | "en";
}) {
  const t = COPY[locale];
  const [tab, setTab] = useState<"register" | "login">("register");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const path = tab === "register" ? "/api/conta/registrar" : "/api/store/login";
      const body = tab === "register" ? { username, password, confirmPassword } : { username, password };
      const res = await fetch(path, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Erro inesperado.");
        return;
      }
      window.location.reload();
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    setLoading(true);
    try {
      await fetch("/api/store/logout", { method: "POST" });
      window.location.reload();
    } finally {
      setLoading(false);
    }
  }

  if (loggedInUsername) {
    return (
      <div className="account-panel">
        <div className="account-success">
          <span>✓</span>
          <h2>{t.welcome(loggedInUsername)}</h2>
          <p>{t.active}</p>
          {characters.length > 0 ? (
            <div className="account-perks" style={{ justifyContent: "center", margin: "20px 0" }}>
              {characters.map((c) => (
                <span key={c.serial}>
                  <b>{c.level}</b> {c.name}
                </span>
              ))}
            </div>
          ) : (
            <p>{t.noChars}</p>
          )}
          <a className="btn btn-primary" href={locale === "en" ? "/en#download" : "/#download"}>
            {t.download}
          </a>
          <a className="btn btn-ghost" href={locale === "en" ? "/en/donate" : "/doacao"} style={{ marginTop: 10 }}>
            {t.store}
          </a>
          {error && <p className="store-error">{error}</p>}
          <button className="forgot" onClick={handleLogout} disabled={loading} style={{ marginTop: 18, background: "none", border: 0, cursor: "pointer" }}>
            {t.logout}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="account-panel">
      <div className="account-tabs">
        <button className={tab === "register" ? "active" : ""} onClick={() => setTab("register")} type="button">
          {t.createTab}
        </button>
        <button className={tab === "login" ? "active" : ""} onClick={() => setTab("login")} type="button">
          {t.loginTab}
        </button>
      </div>
      <form onSubmit={handleSubmit}>
        <h2>{tab === "register" ? t.createTitle : t.loginTitle}</h2>
        <p>{tab === "register" ? t.createHint : t.loginHint}</p>
        <label>
          {t.user}
          <input value={username} onChange={(e) => setUsername(e.target.value)} minLength={4} maxLength={12} required />
        </label>
        {tab === "register" ? (
          <div className="field-row">
            <label>
              {t.pass}
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={4} maxLength={12} required />
            </label>
            <label>
              {t.confirmPass}
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                minLength={4}
                maxLength={12}
                required
              />
            </label>
          </div>
        ) : (
          <label>
            {t.pass}
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} maxLength={12} required />
          </label>
        )}
        {error && <p className="store-error">{error}</p>}
        <button className="btn btn-primary account-submit" disabled={loading}>
          {tab === "register" ? t.createTab : t.loginTab}
        </button>
        <small className="form-note">{t.footNote}</small>
      </form>
    </div>
  );
}
