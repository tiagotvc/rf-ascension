"use client";
import { useMemo, useState } from "react";
import type { PotionCatalogEntry } from "../../lib/potion-catalog";

type Selection = { gpPrice: number; category: string | null };

export default function PotionShopAdminPanel({
  catalog,
  initialSelections,
}: {
  catalog: PotionCatalogEntry[];
  initialSelections: Record<string, Selection>;
}) {
  const [selections, setSelections] = useState<Record<string, Selection>>(initialSelections);
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return catalog;
    return catalog.filter((p) => p.code.toLowerCase().includes(q) || p.name.toLowerCase().includes(q));
  }, [catalog, search]);

  function toggle(code: string) {
    setSelections((prev) => {
      const next = { ...prev };
      if (code in next) {
        delete next[code];
      } else {
        next[code] = { gpPrice: 100, category: null };
      }
      return next;
    });
  }

  function setPrice(code: string, value: number) {
    setSelections((prev) => (code in prev ? { ...prev, [code]: { ...prev[code], gpPrice: Math.max(0, value) } } : prev));
  }

  function setCategory(code: string, value: string) {
    setSelections((prev) => (code in prev ? { ...prev, [code]: { ...prev[code], category: value || null } } : prev));
  }

  async function handleSave() {
    setSaving(true);
    setMessage(null);
    try {
      const body = {
        selections: Object.entries(selections).map(([itemCode, { gpPrice, category }]) => ({ itemCode, gpPrice, category })),
      };
      const res = await fetch("/api/admin/potion-shop", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error ?? "Erro ao salvar.");
        return;
      }
      setMessage(`Salvo — ${body.selections.length} poção(ões) à venda.`);
    } finally {
      setSaving(false);
    }
  }

  const selectedCount = Object.keys(selections).length;

  return (
    <section className="potion-shop-admin">
      <div className="potion-shop-admin-toolbar">
        <input
          className="potion-shop-admin-search"
          placeholder="Buscar por nome ou código..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <span className="potion-shop-admin-count">
          {selectedCount} à venda / {catalog.length} no catálogo
        </span>
        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? "Salvando..." : "Salvar"}
        </button>
      </div>
      {message && <p className="store-message">{message}</p>}
      <div className="potion-shop-admin-grid">
        {filtered.map((p) => {
          const selection = selections[p.code];
          const enabled = selection !== undefined;
          return (
            <div key={p.code} className={`potion-shop-admin-row${enabled ? " enabled" : ""}`}>
              <label className="potion-shop-admin-check">
                <input type="checkbox" checked={enabled} onChange={() => toggle(p.code)} />
                {p.icon ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={`/game-data/${p.icon}`} alt="" />
                ) : (
                  <span className="potion-shop-admin-noicon">?</span>
                )}
              </label>
              <div className="potion-shop-admin-info">
                <strong>{p.name}</strong>
                <small>{p.code}</small>
              </div>
              <input
                className="potion-shop-admin-category"
                type="text"
                disabled={!enabled}
                value={selection?.category ?? ""}
                onChange={(e) => setCategory(p.code, e.target.value)}
                placeholder="Categoria"
              />
              <input
                className="potion-shop-admin-price"
                type="number"
                min={0}
                disabled={!enabled}
                value={selection?.gpPrice ?? ""}
                onChange={(e) => setPrice(p.code, parseInt(e.target.value, 10) || 0)}
                placeholder="GP"
              />
            </div>
          );
        })}
      </div>
    </section>
  );
}
