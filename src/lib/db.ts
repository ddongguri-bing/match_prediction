import type { Game, GameStatus, Member, PickSide, Prediction, Store } from "@/lib/domain";
import { formatIso } from "@/lib/domain";
import { getSupabaseAdmin } from "@/lib/supabase";

export type DbMember = {
  id: string;
  name: string;
  pin_hash: string;
};

export type DbGame = {
  id: string;
  date: string;
  time: string;
  opponent: string;
  status: GameStatus;
  result: PickSide | null;
};

export type DbPrediction = {
  id: string;
  member_id: string;
  game_id: string;
  pick: PickSide;
};

export function mapMember(row: DbMember): Member {
  return { id: row.id, name: row.name, pin: "" };
}

export function mapGame(row: DbGame): Game {
  return {
    id: row.id,
    date: row.date.slice(0, 10),
    time: row.time.slice(0, 5),
    opponent: row.opponent,
    status: row.status,
    result: row.result,
  };
}

export function mapPrediction(row: DbPrediction): Prediction {
  return {
    id: row.id,
    memberId: row.member_id,
    gameId: row.game_id,
    pick: row.pick,
  };
}

export async function loadStore(today = formatIso(new Date())): Promise<Store> {
  const sb = getSupabaseAdmin();
  const [membersRes, gamesRes, predictionsRes] = await Promise.all([
    sb.from("members").select("id, name, pin_hash").order("name"),
    sb.from("games").select("id, date, time, opponent, status, result").order("date", { ascending: false }).order("time", { ascending: false }),
    sb.from("predictions").select("id, member_id, game_id, pick"),
  ]);

  if (membersRes.error) throw new Error(membersRes.error.message);
  if (gamesRes.error) throw new Error(gamesRes.error.message);
  if (predictionsRes.error) throw new Error(predictionsRes.error.message);

  return {
    today,
    members: (membersRes.data as DbMember[]).map(mapMember),
    games: (gamesRes.data as DbGame[]).map(mapGame),
    predictions: (predictionsRes.data as DbPrediction[]).map(mapPrediction),
  };
}

export function jsonError(error: unknown, fallback = "요청을 처리하지 못했습니다.") {
  const message =
    error instanceof Error
      ? error.message.replace(/^Error:\s*/, "").replace(/^Exception:\s*/, "")
      : fallback;

  const status =
    message === "AUTH" || message === "ADMIN_AUTH"
      ? 401
      : message.includes("이미") || message.includes("맞지") || message.includes("입력")
        ? 400
        : 500;

  return Response.json({ error: message }, { status });
}
