import LaunchCountdown from "../../LaunchCountdown";
import AdminLoginForm from "./AdminLoginForm";

export default async function AdminEntrar({
  searchParams,
}: {
  searchParams: Promise<{ return_to?: string }>;
}) {
  const { return_to } = await searchParams;
  return (
    <main className="account-page">
      <header className="site-header forum-nav">
        <a className="brand" href="/"><span className="brand-mark">RF</span><span className="brand-copy"><strong>ECHELON</strong><small>PRIVATE SERVER</small></span></a>
        <a className="header-cta" href="/forum">← Voltar ao fórum</a>
      </header>
      <section className="account-shell">
        <div className="account-story">
          <span className="kicker">ÁREA RESTRITA</span>
          <h1>Login da<br /><em>equipe.</em></h1>
          <p>Por enquanto só a equipe consegue entrar no site. Login com a própria conta do jogo ainda não está disponível — chega junto com o lançamento.</p>
          <LaunchCountdown />
        </div>
        <div className="account-panel">
          <AdminLoginForm returnTo={return_to || "/admin"} />
        </div>
      </section>
    </main>
  );
}
