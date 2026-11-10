import { jsonError } from "@/lib/db";
import { writeSession } from "@/lib/session";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { pin?: string };
    const pin = body.pin ?? "";
    const expected = process.env.ADMIN_PIN ?? "";

    if (!expected) throw new Error("운영진 비밀번호가 설정되지 않았습니다.");
    if (!pin) throw new Error("비밀번호를 입력해 주세요.");
    if (pin !== expected) throw new Error("비밀번호가 맞지 않아요.");

    await writeSession({ role: "admin" });
    return Response.json({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
