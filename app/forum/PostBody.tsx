// Suporte mínimo a links dentro de uma mensagem: `[texto](/caminho)`.
// Nunca usa dangerouslySetInnerHTML — o texto vira nós de texto do React
// (sempre escapado) e só o link vira um elemento real.
function isSafeHref(href: string): boolean {
  return href.startsWith("/") || /^https?:\/\//i.test(href);
}

export default function PostBody({ text }: { text: string }) {
  const nodes: React.ReactNode[] = [];
  let lastIndex = 0;
  let key = 0;
  const linkPattern = /\[([^\]]+)\]\(([^)]+)\)/g;
  let match: RegExpExecArray | null;
  while ((match = linkPattern.exec(text))) {
    if (match.index > lastIndex) nodes.push(text.slice(lastIndex, match.index));
    const [full, label, href] = match;
    nodes.push(
      isSafeHref(href) ? (
        <a className="post-link" href={href} key={key++}>{label}</a>
      ) : (
        full
      )
    );
    lastIndex = match.index + full.length;
  }
  if (lastIndex < text.length) nodes.push(text.slice(lastIndex));
  return <>{nodes}</>;
}
