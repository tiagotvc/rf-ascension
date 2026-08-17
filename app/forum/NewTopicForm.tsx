"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewTopicForm({ forumSlug }: { forumSlug: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    setError(null);
    try {
      const res = await fetch("/api/forum/topics", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ forumSlug, title, body }),
      });
      const data = (await res.json()) as { topic?: { id: number }; error?: string };
      if (!res.ok || !data.topic) {
        setError(data.error ?? "Não foi possível publicar o tópico.");
        return;
      }
      router.push(`/forum/${forumSlug}/topic/${data.topic.id}`);
    } catch {
      setError("Falha de conexão. Tente novamente.");
    } finally {
      setSending(false);
    }
  }

  if (!open) {
    return (
      <button type="button" className="btn btn-primary composer-toggle" onClick={() => setOpen(true)}>
        Novo tópico <span>+</span>
      </button>
    );
  }

  return (
    <form className="composer" onSubmit={onSubmit}>
      <label>
        Título
        <input value={title} onChange={(e) => setTitle(e.target.value)} required minLength={3} maxLength={140} placeholder="Título do tópico" />
      </label>
      <label>
        Mensagem
        <textarea value={body} onChange={(e) => setBody(e.target.value)} required minLength={3} maxLength={8000} placeholder="Escreva sua mensagem..." rows={6} />
      </label>
      {error && <p className="composer-error">{error}</p>}
      <div className="composer-actions">
        <button type="button" className="btn btn-ghost" onClick={() => setOpen(false)} disabled={sending}>Cancelar</button>
        <button type="submit" className="btn btn-primary" disabled={sending}>{sending ? "Publicando..." : "Publicar tópico"}</button>
      </div>
    </form>
  );
}
