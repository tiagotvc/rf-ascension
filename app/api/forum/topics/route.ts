import { getChatGPTUser } from "../../../chatgpt-auth";
import { createForumTopic } from "../../../../db/forum";

function toErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : "Erro inesperado";
  if (message.includes("no such table")) {
    return "O banco do fórum ainda não está pronto. Recarregue a página e tente novamente.";
  }
  return message;
}

export async function POST(request: Request) {
  const user = await getChatGPTUser();
  if (!user) {
    return Response.json({ error: "Entre com sua conta para publicar." }, { status: 401 });
  }

  let payload: { forumSlug?: string; title?: string; body?: string };
  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: "Corpo da requisição inválido." }, { status: 400 });
  }

  const forumSlug = payload.forumSlug?.trim() ?? "";
  const title = payload.title?.trim() ?? "";
  const body = payload.body?.trim() ?? "";
  if (!forumSlug || !title || !body) {
    return Response.json({ error: "Preencha título e mensagem." }, { status: 400 });
  }

  try {
    const topic = await createForumTopic({
      forumSlug,
      title,
      body,
      authorName: user.displayName,
      authorEmail: user.email,
    });
    return Response.json({ topic }, { status: 201 });
  } catch (error) {
    return Response.json({ error: toErrorMessage(error) }, { status: 400 });
  }
}
