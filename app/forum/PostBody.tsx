// Suporte mínimo a quatro sintaxes dentro de uma mensagem:
// - negrito: `**texto**`
// - cor: `{nome:texto}` — nome vem de uma lista fixa (COLOR_MAP), nunca CSS livre
// - link: `[texto](/caminho)`
// - imagem: `![legenda](/caminho)` — ou `![legenda](pending)` pra reservar o
//   espaço de uma foto que ainda não existe (renderiza um placeholder, não
//   uma tag <img> quebrada).
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

export default function PostBody({ text }: { text: string }) {
  const nodes: React.ReactNode[] = [];
  let lastIndex = 0;
  let key = 0;
  const pattern = /!\[([^\]]+)\]\(([^)]+)\)|\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*|\{(\w+):([^}]+)\}/g;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(text))) {
    if (match.index > lastIndex) nodes.push(text.slice(lastIndex, match.index));
    const [full, imgLabel, imgHref, linkLabel, linkHref, boldText, colorName, colorText] = match;
    if (imgLabel !== undefined) {
      if (imgHref === "pending") {
        nodes.push(
          <span className="post-image-pending" key={key++}>
            <i>🖼</i>
            <span>{imgLabel}</span>
          </span>
        );
      } else if (isSafeHref(imgHref)) {
        nodes.push(<img className="post-image" src={imgHref} alt={imgLabel} key={key++} />);
      } else {
        nodes.push(full);
      }
    } else if (linkLabel !== undefined) {
      nodes.push(
        isSafeHref(linkHref) ? (
          <a className="post-link" href={linkHref} key={key++}>{linkLabel}</a>
        ) : (
          full
        )
      );
    } else if (boldText !== undefined) {
      nodes.push(<strong key={key++}>{boldText}</strong>);
    } else if (colorName !== undefined) {
      const hex = COLOR_MAP[colorName];
      nodes.push(hex ? <b style={{ color: hex }} key={key++}>{colorText}</b> : full);
    }
    lastIndex = match.index + full.length;
  }
  if (lastIndex < text.length) nodes.push(text.slice(lastIndex));
  return <>{nodes}</>;
}
