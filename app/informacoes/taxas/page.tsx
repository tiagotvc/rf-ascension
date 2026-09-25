import { serverRates, serverSystems } from "../../config/site";
import { Callout, DocPage } from "../DocPage";

export const metadata = { title: "Taxas e sistemas" };

export default function Taxas() {
  return (
    <DocPage
      kicker="INFORMAÇÕES DO SERVIDOR"
      title="Taxas e sistemas"
      toc={[
        { id: "taxas", label: "Taxas" },
        { id: "sistemas", label: "Sistemas" },
      ]}
    >
      <p className="doc-lead">Evolução rápida sem perder o desafio. Estas são as taxas e os sistemas ativos no RF Echelon.</p>

      <h2 id="taxas">Taxas</h2>
      <div className="doc-table-wrap">
        <table className="doc-table doc-table-kv">
          <tbody>
            {serverRates.map((r) => (
              <tr key={r.label}>
                <th>{r.label}</th>
                <td>
                  <b>{r.value}</b>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 id="sistemas">Sistemas</h2>
      <Callout tone="info">E muitos outros recursos — com mais chegando.</Callout>
      <div className="doc-skills">
        {serverSystems.map((s) => (
          <section className="doc-skill" key={s.name}>
            <div className="doc-skill-head">
              <span className="doc-system-icon">{s.icon}</span>
              <div>
                <span className="doc-tag">{s.active ? "ATIVO" : "DESATIVADO"}</span>
                <h3>{s.name}</h3>
              </div>
            </div>
            {"detail" in s && <p>{s.detail}</p>}
            {"guidePath" in s && (
              <p>
                <a href={s.guidePath}>Ver guia completo →</a>
              </p>
            )}
          </section>
        ))}
      </div>
    </DocPage>
  );
}
