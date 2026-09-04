"use client";
import { useMemo, useState } from "react";
import type { PotionCatalogEntry } from "../../lib/potion-catalog";

export default function PotionShopAdminPanel({
  catalog,
  initialSelections,
}: {
  catalog: PotionCatalogEntry[];
  initialSelections: Record<string, number>;
}) {
  const [selections, setSelections] = useState<Record<string, number>>(initialSelections);
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
        next[code] = 100;
      }
      return next;
    });
  }

  function setPrice(code: string, value: number) {
    setSelections((prev) => (code in prev ? { ...prev, [code]: Math.max(0, value) } : prev));
  }

  async function handleSave() {
    setSaving(true);
    setMessage(null);
    try {
      const body = { selections: Object.entries(selections).map(([itemCode, gpPrice]) => ({ itemCode, gpPrice })) };
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
          const enabled = p.code in selections;
          return (
            <div key={p.code} className={`potion-shop-admin-row${enabled ? " enabled" : ""}`}>
              <label className="potion-shop-admin-check">
                <input type="checkbox" checked={enabled} onChange={() => toggle(p.code)} />
                {p.icon ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={`/game-data/potions/icons/${p.icon}`} alt="" />
                ) : (
                  <span className="potion-shop-admin-noicon">?</span>
                )}
              </label>
              <div className="potion-shop-admin-info">
                <strong>{p.name}</strong>
                <small>{p.code}</small>
              </div>
              <input
                className="potion-shop-admin-price"
                type="number"
                min={0}
                disabled={!enabled}
                value={selections[p.code] ?? ""}
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
