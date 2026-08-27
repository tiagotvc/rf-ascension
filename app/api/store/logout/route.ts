import { cookies } from "next/headers";
import { PLAYER_SESSION_COOKIE_NAME } from "../../../lib/player-auth";

export async function POST() {
  const store = await cookies();
  store.delete(PLAYER_SESSION_COOKIE_NAME);
  return Response.json({ ok: true });
}
