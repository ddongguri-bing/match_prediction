import bcrypt from "bcryptjs";
import { isPin } from "@/lib/domain";
import { jsonError } from "@/lib/db";
import { writeSession } from "@/lib/session";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { name?: string; pin?: string };
    const name = body.name?.trim() ?? "";
    const pin = body.pin ?? "";

    if (!name) throw new Error("이름을 입력해 주세요.");
    if (!isPin(pin)) throw new Error("비밀번호는 숫자 4자리에서 6자리로 입력해 주세요.");

    const sb = getSupabaseAdmin();
    const pinHash = await bcrypt.hash(pin, 10);
    const { data, error } = await sb
      .from("members")
      .insert({ name, pin_hash: pinHash, created_at: new Date().toISOString() })
      .select("id, name")
      .single();

    if (error) {
      if (error.code === "23505") throw new Error("이미 가입된 이름이에요.");
      throw new Error(error.message);
    }

    await writeSession({ role: "member", memberId: data.id, name: data.name });
    return Response.json({ member: { id: data.id, name: data.name } });
  } catch (error) {
    return jsonError(error);
  }
}
