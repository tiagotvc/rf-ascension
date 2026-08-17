"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ReplyForm({ forumSlug, topicId }: { forumSlug: string; topicId: number }) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    setError(null);
    try {
      const res = await fetch(`/api/forum/topics/${topicId}/posts`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ forumSlug, body }),
      });
      const data = (await res.json()) as { post?: unknown; error?: string };
      if (!res.ok || !data.post) {
        setError(data.error ?? "Não foi possível publicar a resposta.");
        return;
      }
      setBody("");
      router.refresh();
    } catch {
      setError("Falha de conexão. Tente novamente.");
    } finally {
      setSending(false);
    }
  }

  return (
    <form className="composer reply-composer" onSubmit={onSubmit}>
      <label>
        Responder
        <textarea value={body} onChange={(e) => setBody(e.target.value)} required minLength={1} maxLength={8000} placeholder="Escreva sua resposta..." rows={4} />
      </label>
      {error && <p className="composer-error">{error}</p>}
      <div className="composer-actions">
        <button type="submit" className="btn btn-primary" disabled={sending}>{sending ? "Enviando..." : "Responder"}</button>
      </div>
    </form>
  );
}
