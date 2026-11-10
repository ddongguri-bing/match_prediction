import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

export type SessionPayload =
  | { role: "member"; memberId: string; name: string; exp: number }
  | { role: "admin"; exp: number };

const COOKIE = "mp_session";
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

function secret() {
  return (
    process.env.SESSION_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    "dev-session-secret"
  );
}

function sign(body: string) {
  return createHmac("sha256", secret()).update(body).digest("base64url");
}

function encode(payload: SessionPayload) {
  const body = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  return `${body}.${sign(body)}`;
}

function decode(token: string): SessionPayload | null {
  const [body, signature] = token.split(".");
  if (!body || !signature) return null;

  const expected = sign(body);
  const left = Buffer.from(signature);
  const right = Buffer.from(expected);
  if (left.length !== right.length || !timingSafeEqual(left, right)) return null;

  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as SessionPayload;
    if (!payload?.exp || payload.exp < Date.now()) return null;
    if (payload.role === "member" && (!payload.memberId || !payload.name)) return null;
    if (payload.role !== "member" && payload.role !== "admin") return null;
    return payload;
  } catch {
    return null;
  }
}

export async function readSession() {
  const jar = await cookies();
  const raw = jar.get(COOKIE)?.value;
  if (!raw) return null;
  return decode(raw);
}

type SessionInput =
  | { role: "member"; memberId: string; name: string }
  | { role: "admin" };

export async function writeSession(payload: SessionInput) {
  const jar = await cookies();
  const full = { ...payload, exp: Date.now() + WEEK_MS } as SessionPayload;
  jar.set(COOKIE, encode(full), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return full;
}

export async function clearSession() {
  const jar = await cookies();
  jar.set(COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}

export function requireMember(session: SessionPayload | null) {
  if (!session || session.role !== "member") {
    throw new Error("AUTH");
  }
  return session;
}

export function requireAdmin(session: SessionPayload | null) {
  if (!session || session.role !== "admin") {
    throw new Error("ADMIN_AUTH");
  }
  return session;
}
