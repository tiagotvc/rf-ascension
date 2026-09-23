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

export default function PromoReviewPanel({ initialSubmissions }: { initialSubmissions: Submission[] }) {
  const [submissions, setSubmissions] = useState(initialSubmissions);
  const [search, setSearch] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return submissions;
    return submissions.filter((s) => s.accountUsername.toLowerCase().includes(q) || s.dailyCode.toLowerCase().includes(q));
  }, [submissions, search]);

  async function toggleFlag(id: number, flagged: boolean) {
    setBusyId(id);
    try {
      const note = flagged ? window.prompt("Motivo (opcional):") ?? "" : "";
      const res = await fetch("/api/admin/promo", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id, flagged, note }),
      });
      if (!res.ok) return;
      setSubmissions((prev) =>
        prev.map((s) => (s.id === id ? { ...s, status: flagged ? "flagged" : "submitted", reviewNote: note || null } : s))
      );
    } finally {
      setBusyId(null);
    }
  }

  const flaggedCount = submissions.filter((s) => s.status === "flagged").length;

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
          {submissions.length} enviado(s) / {flaggedCount} sinalizado(s)
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
          <div key={s.id} className={`promo-admin-row${s.status === "flagged" ? " flagged" : ""}`}>
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
              {s.status === "flagged" ? <b className="promo-admin-flagged">Sinalizado{s.reviewNote ? `: ${s.reviewNote}` : ""}</b> : "OK"}
            </span>
            <span>
              <button
                type="button"
                className="btn btn-ghost"
                disabled={busyId === s.id}
                onClick={() => toggleFlag(s.id, s.status !== "flagged")}
              >
                {s.status === "flagged" ? "Desmarcar" : "Marcar fraude"}
              </button>
            </span>
          </div>
        ))}
        {filtered.length === 0 && <p className="store-error">Nenhuma postagem enviada ainda.</p>}
      </div>
    </section>
  );
}
