"use client";
import { useState } from "react";

export type StorePackage = {
  key: string;
  name: string;
  priceBrlCents: number;
  cashAmount: number;
  stockRemaining: number;
  stockTotal: number;
};

export type StoreCharacter = { serial: number; name: string; level: number };

export default function DonationStore({
  packages,
  loggedInUsername,
  walletBalance,
  characters,
}: {
  packages: StorePackage[];
  loggedInUsername: string | null;
  walletBalance: number | null;
  characters: StoreCharacter[];
}) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [topupAmount, setTopupAmount] = useState("50");
  const [topupError, setTopupError] = useState<string | null>(null);
  const [selectedCharacter, setSelectedCharacter] = useState<number | "">(characters[0]?.serial ?? "");
  const [purchaseMessage, setPurchaseMessage] = useState<string | null>(null);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setLoginError(null);
    try {
      const res = await fetch("/api/store/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setLoginError(data.error ?? "Erro ao entrar.");
        return;
      }
      window.location.reload();
    } finally {
      setLoading(false);
    }
  }

  async function handleTopup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setTopupError(null);
    try {
      const amountBrlCents = Math.round(parseFloat(topupAmount.replace(",", ".")) * 100);
      const res = await fetch("/api/store/topup", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ amountBrlCents }),
      });
      const data = await res.json();
      if (!res.ok) {
        setTopupError(data.error ?? "Erro ao criar cobrança.");
        return;
      }
      window.location.href = data.checkoutUrl;
    } finally {
      setLoading(false);
    }
  }

  async function handlePurchase(packageKey: string) {
    if (!selectedCharacter) {
      setPurchaseMessage("Escolha um personagem primeiro.");
      return;
    }
    setLoading(true);
    setPurchaseMessage(null);
    try {
      const res = await fetch("/api/store/purchase", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ packageKey, characterSerial: selectedCharacter }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPurchaseMessage(data.error ?? "Erro na compra.");
        return;
      }
      setPurchaseMessage(
        "Compra registrada! O pacote fica na fila de entrega até a Fase 2 (entrega automática no jogo) existir."
      );
      window.location.reload();
    } finally {
      setLoading(false);
    }
  }

  if (!loggedInUsername) {
    return (
      <div className="account-panel store-login">
        <form onSubmit={handleLogin}>
          <h2>Entrar com a conta do jogo</h2>
          <p>Use o mesmo usuário e senha do client — é a mesma conta.</p>
          <label>
            Usuário
            <input value={username} onChange={(e) => setUsername(e.target.value)} maxLength={12} required />
          </label>
          <label>
            Senha
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              maxLength={12}
              required
            />
          </label>
          {loginError && <p className="store-error">{loginError}</p>}
          <button className="btn btn-primary account-submit" disabled={loading}>
            Entrar
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="store-panel">
      <div className="account-panel store-wallet">
        <p>
          Logado como <strong>{loggedInUsername}</strong> · Saldo: <strong>{(walletBalance ?? 0).toLocaleString("pt-BR")} CP</strong>
        </p>
        <form onSubmit={handleTopup} className="store-topup-form">
          <input
            value={topupAmount}
            onChange={(e) => setTopupAmount(e.target.value)}
            placeholder="Valor em R$"
            inputMode="decimal"
          />
          <button className="btn btn-ghost" disabled={loading}>
            Recarregar saldo
          </button>
        </form>
        {topupError && <p className="store-error">{topupError}</p>}
        {characters.length > 0 ? (
          <label className="store-character-select">
            Personagem
            <select value={selectedCharacter} onChange={(e) => setSelectedCharacter(Number(e.target.value))}>
              {characters.map((c) => (
                <option key={c.serial} value={c.serial}>
                  {c.name} (nível {c.level})
                </option>
              ))}
            </select>
          </label>
        ) : (
          <p className="store-error">Nenhum personagem encontrado nessa conta.</p>
        )}
      </div>

      <div className="pack-grid">
        {packages.map((p, i) => (
          <div className={`cash-pack tier-${(i % 4) + 1}`} key={p.key}>
            <div className="pack-top">
              <span>{p.name}</span>
              <i>
                {p.stockRemaining}/{p.stockTotal} em estoque
              </i>
            </div>
            <div className="cash-value">
              <b>◈</b>
              <strong>{p.cashAmount.toLocaleString("pt-BR")}</strong>
              <small>CASH POINTS</small>
            </div>
            <div className="pack-price">R$ {(p.priceBrlCents / 100).toFixed(2).replace(".", ",")}</div>
            <button
              className="btn btn-primary"
              disabled={loading || p.stockRemaining <= 0 || characters.length === 0}
              onClick={() => handlePurchase(p.key)}
            >
              {p.stockRemaining <= 0 ? "Esgotado" : "Comprar com saldo"}
            </button>
          </div>
        ))}
      </div>
      {purchaseMessage && <p className="store-message">{purchaseMessage}</p>}
    </div>
  );
}
