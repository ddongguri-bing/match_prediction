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
    const { data, error } = await sb
      .from("members")
      .select("id, name, pin_hash")
      .eq("name", name)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!data) throw new Error("가입되지 않은 이름이에요.");

    const ok = await bcrypt.compare(pin, data.pin_hash);
    if (!ok) throw new Error("비밀번호가 맞지 않아요.");

    await writeSession({ role: "member", memberId: data.id, name: data.name });
    return Response.json({ member: { id: data.id, name: data.name } });
  } catch (error) {
    return jsonError(error);
  }
}
