import { getChatGPTUser } from "../../../../../chatgpt-auth";
import { createForumReply } from "../../../../../../db/forum";

function toErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : "Erro inesperado";
  if (message.includes("no such table")) {
    return "O banco do fórum ainda não está pronto. Recarregue a página e tente novamente.";
  }
  return message;
}

export async function POST(request: Request, { params }: { params: Promise<{ topicId: string }> }) {
  const user = await getChatGPTUser();
  if (!user) {
    return Response.json({ error: "Entre com sua conta para responder." }, { status: 401 });
  }

  const { topicId: topicIdParam } = await params;
  const topicId = Number(topicIdParam);
  if (!Number.isInteger(topicId)) {
    return Response.json({ error: "Tópico inválido." }, { status: 400 });
  }

  let payload: { forumSlug?: string; body?: string };
  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: "Corpo da requisição inválido." }, { status: 400 });
  }

  const forumSlug = payload.forumSlug?.trim() ?? "";
  const body = payload.body?.trim() ?? "";
  if (!forumSlug || !body) {
    return Response.json({ error: "Escreva uma resposta." }, { status: 400 });
  }

  try {
    const post = await createForumReply({
      forumSlug,
      topicId,
      body,
      authorName: user.displayName,
      authorEmail: user.email,
    });
    return Response.json({ post }, { status: 201 });
  } catch (error) {
    return Response.json({ error: toErrorMessage(error) }, { status: 400 });
  }
}
