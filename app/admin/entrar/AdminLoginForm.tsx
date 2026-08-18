"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginForm({ returnTo }: { returnTo: string }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setError(data.error ?? "Não foi possível entrar.");
        return;
      }
      router.push(returnTo);
      router.refresh();
    } catch {
      setError("Falha de conexão. Tente novamente.");
    } finally {
      setSending(false);
    }
  }

  return (
    <form className="composer" onSubmit={onSubmit}>
      <label>
        Senha da equipe
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoFocus
          placeholder="••••••••"
        />
      </label>
      {error && <p className="composer-error">{error}</p>}
      <div className="composer-actions">
        <button type="submit" className="btn btn-primary" disabled={sending}>
          {sending ? "Entrando..." : "Entrar"}
        </button>
      </div>
    </form>
  );
}
