import { isPredictionClosed, type PickSide } from "@/lib/domain";
import { jsonError } from "@/lib/db";
import { readSession, requireMember } from "@/lib/session";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const session = requireMember(await readSession());
    const body = (await request.json()) as { gameId?: string; pick?: PickSide };
    const gameId = body.gameId ?? "";
    const pick = body.pick;

    if (!gameId || !pick || !["W", "D", "L"].includes(pick)) {
      throw new Error("승부 예측을 먼저 골라 주세요.");
    }

    const sb = getSupabaseAdmin();
    const { data: game, error: gameError } = await sb
      .from("games")
      .select("id, date, time, status")
      .eq("id", gameId)
      .maybeSingle();

    if (gameError) throw new Error(gameError.message);
    if (!game) throw new Error("경기를 찾을 수 없습니다.");
    if (game.status !== "scheduled") throw new Error("예측할 수 없는 경기입니다.");

    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, "0");
    const d = String(today.getDate()).padStart(2, "0");
    const gameDate = String(game.date).slice(0, 10);
    if (gameDate !== `${y}-${m}-${d}`) {
      throw new Error("오늘 경기에만 예측할 수 있어요.");
    }

    if (
      isPredictionClosed(
        { date: gameDate, time: String(game.time).slice(0, 5) },
        new Date(),
      )
    ) {
      throw new Error("오늘 승부 예측 가능한 시간이 지났어요.");
    }

    const now = new Date().toISOString();
    const { data: existing, error: existingError } = await sb
      .from("predictions")
      .select("id")
      .eq("member_id", session.memberId)
      .eq("game_id", gameId)
      .maybeSingle();

    if (existingError) throw new Error(existingError.message);

    const { error } = existing
      ? await sb
          .from("predictions")
          .update({ pick, updated_at: now })
          .eq("id", existing.id)
      : await sb.from("predictions").insert({
          member_id: session.memberId,
          game_id: gameId,
          pick,
          created_at: now,
          updated_at: now,
        });

    if (error) throw new Error(error.message);
    return Response.json({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
