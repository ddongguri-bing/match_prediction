import { formatIso, standings } from "@/lib/domain";
import { jsonError, loadStore } from "@/lib/db";
import { readSession, requireAdmin } from "@/lib/session";

export async function GET() {
  try {
    requireAdmin(await readSession());
    const today = formatIso(new Date());
    const store = await loadStore(today);

    return Response.json({
      today,
      games: store.games,
      members: store.members,
      predictions: store.predictions,
      standings: standings(store),
    });
  } catch (error) {
    return jsonError(error);
  }
}
