import { jsonError } from "@/lib/db";
import { readSession } from "@/lib/session";

export async function GET() {
  try {
    const session = await readSession();
    if (!session) return Response.json({ session: null });

    if (session.role === "member") {
      return Response.json({
        session: { role: "member", memberId: session.memberId, name: session.name },
      });
    }

    return Response.json({ session: { role: "admin" } });
  } catch (error) {
    return jsonError(error);
  }
}
