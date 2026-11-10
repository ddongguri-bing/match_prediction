import { formatIso } from "@/lib/domain";
import { jsonError, loadStore } from "@/lib/db";
import { readSession, requireMember } from "@/lib/session";

export async function GET() {
  try {
    const session = requireMember(await readSession());
    const today = formatIso(new Date());
    const store = await loadStore(today);

    return Response.json({
      today,
      member: { id: session.memberId, name: session.name },
      games: store.games,
      predictions: store.predictions.filter((item) => item.memberId === session.memberId),
      members: store.members,
    });
  } catch (error) {
    return jsonError(error);
  }
}
