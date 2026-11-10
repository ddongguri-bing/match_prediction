import bcrypt from "bcryptjs";
import { isPin } from "@/lib/domain";
import { jsonError } from "@/lib/db";
import { readSession, requireAdmin } from "@/lib/session";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function PATCH(request: Request) {
  try {
    requireAdmin(await readSession());
    const body = (await request.json()) as { id?: string; pin?: string };
    const id = body.id ?? "";
    const pin = body.pin ?? "";

    if (!id) throw new Error("회원을 선택해 주세요.");
    if (!isPin(pin)) throw new Error("숫자 4자리에서 6자리로 입력해 주세요.");

    const sb = getSupabaseAdmin();
    const pinHash = await bcrypt.hash(pin, 10);
    const { error } = await sb.from("members").update({ pin_hash: pinHash }).eq("id", id);
    if (error) throw new Error(error.message);
    return Response.json({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE(request: Request) {
  try {
    requireAdmin(await readSession());
    const body = (await request.json()) as { id?: string };
    const id = body.id ?? "";
    if (!id) throw new Error("회원을 선택해 주세요.");

    const sb = getSupabaseAdmin();
    const { error } = await sb.from("members").delete().eq("id", id);
    if (error) throw new Error(error.message);
    return Response.json({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
