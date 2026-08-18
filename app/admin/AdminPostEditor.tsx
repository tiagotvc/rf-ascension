"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ForumArea } from "../config/forum";

export default function AdminPostEditor({ areas }: { areas: ForumArea[] }) {
  const router = useRouter();
  const [forumSlug, setForumSlug] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [pinned, setPinned] = useState(false);
  const [commentsAllowed, setCommentsAllowed] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/topics", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ forumSlug, title, body, pinned, commentsAllowed }),
      });
      const data = (await res.json()) as { topic?: { id: number }; error?: string };
      if (!res.ok || !data.topic) {
        setError(data.error ?? "Não foi possível publicar o post.");
        return;
      }
      router.push(`/forum/${forumSlug}/topic/${data.topic.id}`);
    } catch {
      setError("Falha de conexão. Tente novamente.");
    } finally {
      setSending(false);
    }
  }

  return (
    <form className="editor-layout" onSubmit={onSubmit}>
      <div className="post-editor">
        <div className="editor-block">
          <label>TÍTULO DO POST <small>{title.length} / 140</small></label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={140} required placeholder="Digite um título claro e objetivo..." />
          <p>O título será exibido nas listagens e nos resultados de busca.</p>
        </div>
        <div className="editor-block">
          <label>SEÇÃO DO FÓRUM</label>
          <select value={forumSlug} onChange={(e) => setForumSlug(e.target.value)} required>
            <option value="" disabled>Selecione uma seção</option>
            {areas.map((area) => (
              <optgroup label={area.title} key={area.code}>
                {area.boards.map((board) => (
                  <option value={board.slug} key={board.slug}>{board.title}</option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>
        <div className="editor-block content-editor">
          <label>CONTEÚDO</label>
          <textarea value={body} onChange={(e) => setBody(e.target.value)} maxLength={8000} required rows={12} placeholder="Escreva o conteúdo do post... Aceita **negrito**, {cor:texto}, [link](/caminho) e ![legenda](/caminho)." />
          <footer><span>Sintaxe do fórum disponível (negrito, cor, link, imagem)</span><b>{body.trim() ? body.trim().split(/\s+/).length : 0} palavras</b></footer>
        </div>
        {error && <p className="composer-error">{error}</p>}
      </div>
      <aside className="publish-panel">
        <section>
          <header><span>PUBLICAÇÃO</span></header>
          <label className="toggle-line">
            <span><b>Fixar no topo</b><small>Manter como destaque na seção</small></span>
            <input type="checkbox" checked={pinned} onChange={(e) => setPinned(e.target.checked)} />
          </label>
          <label className="toggle-line">
            <span><b>Permitir respostas</b><small>Jogadores podem comentar</small></span>
            <input type="checkbox" checked={commentsAllowed} onChange={(e) => setCommentsAllowed(e.target.checked)} />
          </label>
        </section>
        <button type="submit" className="publish-button" disabled={sending}>
          {sending ? "Publicando..." : "PUBLICAR AGORA ↗"}
        </button>
      </aside>
    </form>
  );
}
