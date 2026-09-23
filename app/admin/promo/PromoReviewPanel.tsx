"use client";
import { useMemo, useState } from "react";

type Submission = {
  id: number;
  accountUsername: string;
  submissionDate: string;
  dailyCode: string;
  postUrl: string | null;
  status: string;
  reviewedBy: string | null;
  reviewNote: string | null;
};

const STATUS_LABEL: Record<string, string> = {
  submitted: "Aguardando revisão",
  approved: "Aprovado — GP pago",
  rejected: "Recusado",
};

export default function PromoReviewPanel({ initialSubmissions }: { initialSubmissions: Submission[] }) {
  const [submissions, setSubmissions] = useState(initialSubmissions);
  const [search, setSearch] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return submissions;
    return submissions.filter((s) => s.accountUsername.toLowerCase().includes(q) || s.dailyCode.toLowerCase().includes(q));
  }, [submissions, search]);

  async function decide(id: number, decision: "approved" | "rejected") {
    setBusyId(id);
    try {
      const note = decision === "rejected" ? window.prompt("Motivo da recusa (opcional):") ?? "" : "";
      const res = await fetch("/api/admin/promo", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id, decision, note }),
      });
      if (!res.ok) return;
      setSubmissions((prev) => prev.map((s) => (s.id === id ? { ...s, status: decision, reviewNote: note || null } : s)));
    } finally {
      setBusyId(null);
    }
  }

  const pendingCount = submissions.filter((s) => s.status === "submitted").length;

  return (
    <section className="promo-admin">
      <div className="promo-admin-toolbar">
        <input
          className="potion-shop-admin-search"
          placeholder="Buscar por conta ou código..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <span className="potion-shop-admin-count">
          {pendingCount} aguardando revisão / {submissions.length} no total
        </span>
      </div>
      <div className="promo-admin-list">
        <div className="promo-admin-row promo-admin-row-head">
          <span>Data</span>
          <span>Conta</span>
          <span>Código do dia</span>
          <span>Postagem enviada</span>
          <span>Status</span>
          <span />
        </div>
        {filtered.map((s) => (
          <div key={s.id} className={`promo-admin-row promo-admin-status-${s.status}`}>
            <span>{s.submissionDate}</span>
            <span>{s.accountUsername}</span>
            <span className="promo-admin-code">{s.dailyCode}</span>
            <span className="promo-admin-link">
              {s.postUrl ? (
                <a href={s.postUrl} target="_blank" rel="noreferrer">
                  Abrir postagem ↗
                </a>
              ) : (
                "—"
              )}
            </span>
            <span>
              <b className={`promo-admin-badge promo-admin-badge-${s.status}`}>{STATUS_LABEL[s.status] ?? s.status}</b>
              {s.reviewNote && <small className="promo-admin-note"> — {s.reviewNote}</small>}
            </span>
            <span className="promo-admin-actions">
              <button type="button" className="btn btn-primary" disabled={busyId === s.id || s.status === "approved"} onClick={() => decide(s.id, "approved")}>
                Aprovar
              </button>
              <button type="button" className="btn btn-ghost" disabled={busyId === s.id || s.status === "rejected"} onClick={() => decide(s.id, "rejected")}>
                Recusar
              </button>
            </span>
          </div>
        ))}
        {filtered.length === 0 && <p className="store-error">Nenhuma postagem enviada ainda.</p>}
      </div>
    </section>
  );
}
