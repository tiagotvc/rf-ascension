"use client";
import { Fragment, useEffect, useState } from "react";

// Suporte mínimo a seis sintaxes dentro de uma mensagem:
// - negrito: `**texto**`
// - cor: `{nome:texto}` — nome vem de uma lista fixa (COLOR_MAP), nunca CSS livre
// - link: `[texto](/caminho)`
// - imagem: `![legenda](/caminho)` — ou `![legenda](pending)` pra reservar o
//   espaço de uma foto que ainda não existe (renderiza um placeholder, não
//   uma tag <img> quebrada). Imagem real é clicável e abre em zoom. Ocupa a
//   largura toda, uma por linha.
// - ícone inline: `!icon[legenda](/caminho)` — mesma ideia, mas pequeno e no
//   fluxo do texto, pra montar fórmula de combinação lado a lado (ex.: item
//   + material ×N = resultado) sem precisar de captura de tela pronta.
//   Aceita um segundo `(/caminho-do-tooltip)` logo em seguida — mostra essa
//   imagem (o tooltip real do item, por exemplo) só no hover/foco do ícone,
//   igual passar o mouse em cima do item no jogo.
// - tabela: bloco de linhas `| célula | célula |`, com uma linha separadora
//   `|---|---|` (aceita `:---`, `:---:`, `---:` pra alinhamento) logo depois
//   do cabeçalho — sintaxe padrão de tabela markdown. Cada célula aceita as
//   sintaxes acima (negrito, cor, link).
// Nunca usa dangerouslySetInnerHTML — o texto vira nós de texto do React
// (sempre escapado) e só o elemento reconhecido vira um nó real.
function isSafeHref(href: string): boolean {
  return href.startsWith("/") || /^https?:\/\//i.test(href);
}

// Paleta fixa (ex.: raridade de item) — nome livre no texto, mas só resolve
// pra cor se estiver aqui. Nome desconhecido cai pro texto puro, sem estilo.
const COLOR_MAP: Record<string, string> = {
  white: "#c8ced5",
  green: "#59e7a4",
  orange: "#ff9a52",
  cyan: "#5ce1e6",
  violet: "#8c7cff",
  pink: "#ff6ec7",
  gold: "#e9b960",
  red: "#ff6b6b",
};

const INLINE_PATTERN =
  /!\[([^\]]+)\]\(([^)]+)\)|!icon\[([^\]]+)\]\(([^)]+)\)(?:\(([^)]+)\))?|\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*|\{(\w+):([^}]+)\}/g;

function renderInline(
  text: string,
  onZoom: (z: { src: string; alt: string }) => void,
  keyPrefix: string
): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  let lastIndex = 0;
  let key = 0;
  const pattern = new RegExp(INLINE_PATTERN.source, "g");
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(text))) {
    if (match.index > lastIndex) nodes.push(text.slice(lastIndex, match.index));
    const [full, imgLabel, imgHref, iconLabel, iconHref, iconTooltipHref, linkLabel, linkHref, boldText, colorName, colorText] =
      match;
    if (imgLabel !== undefined) {
      if (imgHref === "pending") {
        nodes.push(
          <span className="post-image-pending" key={`${keyPrefix}-${key++}`}>
            <i>🖼</i>
            <span>{imgLabel}</span>
          </span>
        );
      } else if (isSafeHref(imgHref)) {
        nodes.push(
          <button
            type="button"
            className="post-image-trigger"
            key={`${keyPrefix}-${key++}`}
            onClick={() => onZoom({ src: imgHref, alt: imgLabel })}
            aria-label={`Ampliar imagem: ${imgLabel}`}
          >
            <img className="post-image" src={imgHref} alt={imgLabel} />
          </button>
        );
      } else {
        nodes.push(full);
      }
    } else if (iconLabel !== undefined) {
      if (iconHref === "pending") {
        nodes.push(
          <span className="post-icon-pending" key={`${keyPrefix}-${key++}`} title={iconLabel}>
            🖼
          </span>
        );
      } else if (isSafeHref(iconHref)) {
        const hasTooltip = iconTooltipHref !== undefined && isSafeHref(iconTooltipHref);
        nodes.push(
          <button
            type="button"
            className="post-icon-trigger"
            key={`${keyPrefix}-${key++}`}
            onClick={() => onZoom({ src: iconHref, alt: iconLabel })}
            aria-label={`Ampliar imagem: ${iconLabel}`}
          >
            <img className="post-icon" src={iconHref} alt={iconLabel} />
            {hasTooltip && (
              <span className="post-icon-tooltip">
                <img src={iconTooltipHref} alt="" aria-hidden="true" />
              </span>
            )}
          </button>
        );
      } else {
        nodes.push(full);
      }
    } else if (linkLabel !== undefined) {
      nodes.push(
        isSafeHref(linkHref) ? (
          <a className="post-link" href={linkHref} key={`${keyPrefix}-${key++}`}>{linkLabel}</a>
        ) : (
          full
        )
      );
    } else if (boldText !== undefined) {
      nodes.push(<strong key={`${keyPrefix}-${key++}`}>{boldText}</strong>);
    } else if (colorName !== undefined) {
      const hex = COLOR_MAP[colorName];
      nodes.push(hex ? <b style={{ color: hex }} key={`${keyPrefix}-${key++}`}>{colorText}</b> : full);
    }
    lastIndex = match.index + full.length;
  }
  if (lastIndex < text.length) nodes.push(text.slice(lastIndex));
  return nodes;
}

type Align = "left" | "center" | "right";
type Block = { type: "table"; header: string[]; align: Align[]; rows: string[][] } | { type: "text"; content: string };

function splitRow(line: string): string[] {
  const trimmed = line.trim().replace(/^\|/, "").replace(/\|$/, "");
  return trimmed.split("|").map((cell) => cell.trim());
}

function isTableRow(line: string): boolean {
  const t = line.trim();
  return t.startsWith("|") && t.endsWith("|") && t.length > 1;
}

function isSeparatorRow(line: string): boolean {
  if (!isTableRow(line)) return false;
  const cells = splitRow(line);
  return cells.length > 0 && cells.every((c) => /^:?-{3,}:?$/.test(c));
}

function cellAlign(separator: string): Align {
  const left = separator.startsWith(":");
  const right = separator.endsWith(":");
  if (left && right) return "center";
  if (right) return "right";
  return "left";
}

// Quebra o corpo do post em blocos de texto e blocos de tabela (sintaxe
// markdown padrão: linha de cabeçalho, linha separadora `|---|---|`, linhas
// de dado) — o resto continua sendo tratado como texto corrido, com \n
// preservado (o container usa white-space:pre-wrap).
function parseBlocks(text: string): Block[] {
  const lines = text.split("\n");
  const blocks: Block[] = [];
  let buffer: string[] = [];
  const flush = () => {
    if (buffer.length) {
      blocks.push({ type: "text", content: buffer.join("\n") });
      buffer = [];
    }
  };
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const next = lines[i + 1];
    if (next !== undefined && isTableRow(line) && isSeparatorRow(next)) {
      flush();
      const header = splitRow(line);
      const align = splitRow(next).map(cellAlign);
      i += 2;
      const rows: string[][] = [];
      while (i < lines.length && isTableRow(lines[i])) {
        rows.push(splitRow(lines[i]));
        i++;
      }
      blocks.push({ type: "table", header, align, rows });
    } else {
      buffer.push(line);
      i++;
    }
  }
  flush();
  return blocks;
}

export default function PostBody({ text }: { text: string }) {
  const [zoomed, setZoomed] = useState<{ src: string; alt: string } | null>(null);

  useEffect(() => {
    if (!zoomed) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setZoomed(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [zoomed]);

  const blocks = parseBlocks(text);

  return (
    <>
      {blocks.map((block, blockIndex) => {
        if (block.type === "table") {
          return (
            <table className="post-table" key={`b${blockIndex}`}>
              <thead>
                <tr>
                  {block.header.map((cell, ci) => (
                    <th key={ci} style={{ textAlign: block.align[ci] }}>
                      {renderInline(cell, setZoomed, `b${blockIndex}-th${ci}`)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {block.rows.map((row, ri) => (
                  <tr key={ri}>
                    {row.map((cell, ci) => (
                      <td key={ci} style={{ textAlign: block.align[ci] }}>
                        {renderInline(cell, setZoomed, `b${blockIndex}-r${ri}-${ci}`)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          );
        }
        return <Fragment key={`b${blockIndex}`}>{renderInline(block.content, setZoomed, `b${blockIndex}`)}</Fragment>;
      })}
      {zoomed && (
        <div className="post-image-lightbox" role="dialog" aria-modal="true" onClick={() => setZoomed(null)}>
          <button
            type="button"
            className="post-image-lightbox-close"
            onClick={() => setZoomed(null)}
            aria-label="Fechar"
          >
            ✕
          </button>
          <img src={zoomed.src} alt={zoomed.alt} onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </>
  );
}
