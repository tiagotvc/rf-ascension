import { requireSessionUser } from "../../lib/auth";
import { listRecentOrders } from "../../../db/store";
import AdminLogoutButton from "../AdminLogoutButton";

export const dynamic = "force-dynamic";

const Brand = () => (
  <span className="brand">
    <span className="brand-mark">RF</span>
    <span className="brand-copy">
      <strong>ECHELON</strong>
      <small>ADMIN CONSOLE</small>
    </span>
  </span>
);

const STATUS_LABEL: Record<string, string> = {
  paid: "Pago",
  pending: "Pendente",
  failed: "Falhou",
  refunded: "Estornado",
};

const KIND_LABEL: Record<string, string> = {
  topup: "Recarga",
  package_purchase: "Pacote",
};

function formatDate(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

export default async function AdminOrders() {
  const user = await requireSessionUser("/admin/orders");
  const orders = await listRecentOrders(200);

  const paidTopups = orders.filter((o) => o.kind === "topup" && o.status === "paid");
  const totalPaidBrlCents = paidTopups.reduce((sum, o) => sum + (o.amountBrlCents ?? 0), 0);
  const pendingCount = orders.filter((o) => o.status === "pending").length;

  return (
    <main className="admin-page">
      <aside className="admin-sidebar">
        <a href="/">
          <Brand />
        </a>
        <nav>
          <span>GERENCIAMENTO</span>
          <a href="/admin">
            <i>✎</i> Criar post
          </a>
          <a href="/admin/potions">
            <i>⚗</i> Loja de poções
          </a>
          <a className="active" href="/admin/orders">
            <i>◈</i> Pedidos <b>{pendingCount > 0 ? pendingCount : orders.length}</b>
          </a>
          <a href="/forum">
            <i>◫</i> Áreas do fórum
          </a>
        </nav>
        <div className="admin-user">
          <i>{user.displayName.slice(0, 2).toUpperCase()}</i>
          <span>
            <strong>{user.displayName}</strong>
            <small>Equipe</small>
          </span>
          <AdminLogoutButton />
        </div>
      </aside>
      <section className="admin-workspace">
        <header>
          <div>
            <span>PAINEL ADMINISTRATIVO</span>
            <h1>Pedidos</h1>
          </div>
        </header>

        <div className="admin-orders-summary">
          <div>
            <strong>{paidTopups.length}</strong>
            <span>recargas pagas</span>
          </div>
          <div>
            <strong>R$ {(totalPaidBrlCents / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</strong>
            <span>total recebido</span>
          </div>
          <div>
            <strong>{pendingCount}</strong>
            <span>pendentes</span>
          </div>
        </div>

        {orders.length === 0 ? (
          <p style={{ color: "#58636e", fontSize: 11, marginTop: 24 }}>Nenhum pedido ainda.</p>
        ) : (
          <div className="admin-orders-table">
            <div className="admin-orders-row admin-orders-head">
              <span>Data</span>
              <span>Conta</span>
              <span>Personagem</span>
              <span>Tipo</span>
              <span>Valor</span>
              <span>Status</span>
              <span>ID Asaas</span>
            </div>
            {orders.map((o) => (
              <div className="admin-orders-row" key={o.id}>
                <span>{formatDate(o.createdAt)}</span>
                <span>{o.accountUsername}</span>
                <span>{o.characterName ?? "—"}</span>
                <span>{KIND_LABEL[o.kind] ?? o.kind}</span>
                <span>
                  {o.kind === "topup"
                    ? `R$ ${((o.amountBrlCents ?? 0) / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
                    : o.gpPrice !== null
                      ? `${o.gpPrice.toLocaleString("pt-BR")} GP${o.packageName ? ` (${o.packageName})` : ""}`
                      : "—"}
                </span>
                <span className={`admin-orders-status admin-orders-status-${o.status}`}>{STATUS_LABEL[o.status] ?? o.status}</span>
                <span className="admin-orders-mono">{o.asaasPaymentId ?? "—"}</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
