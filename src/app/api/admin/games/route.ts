import { canEnterResult, formatIso, type PickSide } from "@/lib/domain";
import { jsonError, mapGame, type DbGame } from "@/lib/db";
import { readSession, requireAdmin } from "@/lib/session";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    requireAdmin(await readSession());
    const body = (await request.json()) as { date?: string; time?: string; opponent?: string };
    const date = body.date ?? "";
    const time = body.time ?? "";
    const opponent = body.opponent?.trim() ?? "";

    if (!date || !time || !opponent) throw new Error("날짜, 시간, 상대팀을 입력해 주세요.");

    const sb = getSupabaseAdmin();
    const { data: existing, error: existingError } = await sb
      .from("games")
      .select("id")
      .eq("date", date)
      .eq("time", time)
      .eq("opponent", opponent)
      .maybeSingle();

    if (existingError) throw new Error(existingError.message);
    if (existing) throw new Error("같은 일정이 이미 있습니다.");

    const { data, error } = await sb
      .from("games")
      .insert({
        date,
        time,
        opponent,
        status: "scheduled",
        result: null,
        created_at: new Date().toISOString(),
      })
      .select("id, date, time, opponent, status, result")
      .single();

    if (error) throw new Error(error.message);
    return Response.json({ game: mapGame(data as DbGame) });
  } catch (error) {
    return jsonError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    requireAdmin(await readSession());
    const body = (await request.json()) as {
      id?: string;
      date?: string;
      time?: string;
      opponent?: string;
      status?: "scheduled" | "rain" | "final";
      result?: PickSide | null;
    };

    const id = body.id ?? "";
    if (!id) throw new Error("경기를 찾을 수 없습니다.");

    const sb = getSupabaseAdmin();
    const { data: current, error: currentError } = await sb
      .from("games")
      .select("id, date, time, opponent, status, result")
      .eq("id", id)
      .maybeSingle();

    if (currentError) throw new Error(currentError.message);
    if (!current) throw new Error("경기를 찾을 수 없습니다.");

    if (body.date || body.time || body.opponent) {
      const date = body.date ?? current.date;
      const time = body.time ?? current.time;
      const opponent = (body.opponent ?? current.opponent).trim();
      if (!date || !time || !opponent) throw new Error("날짜, 시간, 상대팀을 입력해 주세요.");

      const { data: dup, error: dupError } = await sb
        .from("games")
        .select("id")
        .eq("date", date)
        .eq("time", time)
        .eq("opponent", opponent)
        .neq("id", id)
        .maybeSingle();

      if (dupError) throw new Error(dupError.message);
      if (dup) throw new Error("같은 일정이 이미 있습니다.");

      const { data, error } = await sb
        .from("games")
        .update({ date, time, opponent })
        .eq("id", id)
        .select("id, date, time, opponent, status, result")
        .single();

      if (error) throw new Error(error.message);
      return Response.json({ game: mapGame(data as DbGame) });
    }

    if (body.status) {
      const today = formatIso(new Date());
      const game = mapGame(current as DbGame);

      if (body.status === "final") {
        if (!body.result) throw new Error("결과를 선택해 주세요.");
        if (!canEnterResult(game, today, new Date())) {
          throw new Error("아직 결과를 입력할 수 없어요.");
        }
        const { data, error } = await sb
          .from("games")
          .update({ status: "final", result: body.result })
          .eq("id", id)
          .select("id, date, time, opponent, status, result")
          .single();
        if (error) throw new Error(error.message);
        return Response.json({ game: mapGame(data as DbGame) });
      }

      if (body.status === "rain") {
        const { data, error } = await sb
          .from("games")
          .update({ status: "rain", result: null })
          .eq("id", id)
          .select("id, date, time, opponent, status, result")
          .single();
        if (error) throw new Error(error.message);
        return Response.json({ game: mapGame(data as DbGame) });
      }

      const { data, error } = await sb
        .from("games")
        .update({ status: "scheduled", result: null })
        .eq("id", id)
        .select("id, date, time, opponent, status, result")
        .single();
      if (error) throw new Error(error.message);
      return Response.json({ game: mapGame(data as DbGame) });
    }

    throw new Error("수정할 내용이 없습니다.");
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE(request: Request) {
  try {
    requireAdmin(await readSession());
    const body = (await request.json()) as { id?: string };
    const id = body.id ?? "";
    if (!id) throw new Error("경기를 찾을 수 없습니다.");

    const sb = getSupabaseAdmin();
    const { error: predictionError } = await sb
      .from("predictions")
      .delete()
      .eq("game_id", id);
    if (predictionError) throw new Error(predictionError.message);

    const { error } = await sb.from("games").delete().eq("id", id);
    if (error) throw new Error(error.message);
    return Response.json({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
