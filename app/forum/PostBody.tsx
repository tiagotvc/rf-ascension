// Suporte mínimo a três sintaxes dentro de uma mensagem:
// - negrito: `**texto**`
// - link: `[texto](/caminho)`
// - imagem: `![legenda](/caminho)` — ou `![legenda](pending)` pra reservar o
//   espaço de uma foto que ainda não existe (renderiza um placeholder, não
//   uma tag <img> quebrada).
// Nunca usa dangerouslySetInnerHTML — o texto vira nós de texto do React
// (sempre escapado) e só o elemento reconhecido vira um nó real.
function isSafeHref(href: string): boolean {
  return href.startsWith("/") || /^https?:\/\//i.test(href);
}

export default function PostBody({ text }: { text: string }) {
  const nodes: React.ReactNode[] = [];
  let lastIndex = 0;
  let key = 0;
  const pattern = /!\[([^\]]+)\]\(([^)]+)\)|\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*/g;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(text))) {
    if (match.index > lastIndex) nodes.push(text.slice(lastIndex, match.index));
    const [full, imgLabel, imgHref, linkLabel, linkHref, boldText] = match;
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
    }
    lastIndex = match.index + full.length;
  }
  if (lastIndex < text.length) nodes.push(text.slice(lastIndex));
  return <>{nodes}</>;
}
