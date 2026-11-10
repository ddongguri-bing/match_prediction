"use client";

import { useState } from "react";
import { isPin } from "@/lib/domain";
import { Button, Card, ErrorText, Field, Label } from "@/components/ui";

type LoginViewProps = {
  onLogin: (name: string, pin: string) => Promise<string | null>;
  onRegister: (name: string, pin: string) => Promise<string | null>;
  onAdmin: () => void;
};

export function LoginView({ onLogin, onRegister, onAdmin }: LoginViewProps) {
  const [name, setName] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function readInput() {
    const nextName = name.trim();
    if (!nextName) {
      setError("이름을 입력해 주세요.");
      return null;
    }
    if (!isPin(pin)) {
      setError("비밀번호는 숫자 4자리에서 6자리로 입력해 주세요.");
      return null;
    }
    return { name: nextName, pin };
  }

  async function run(kind: "login" | "register") {
    const input = readInput();
    if (!input) return;
    setBusy(true);
    setError("");
    try {
      const message = kind === "login" ? await onLogin(input.name, input.pin) : await onRegister(input.name, input.pin);
      setError(message ?? "");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Card>
        <h1 className="text-[17px] font-extrabold">어서 오세요 👋</h1>
        <p className="mt-1 text-[13px] leading-6 text-sub">
          이름과 비밀번호만 있으면 됩니다. 처음이면 &quot;처음이에요&quot;를 눌러 주세요.
        </p>
        <Label>이름</Label>
        <Field
          value={name}
          maxLength={12}
          autoComplete="username"
          onChange={(event) => setName(event.target.value)}
        />
        <Label>비밀번호 (숫자 4~6자리)</Label>
        <Field
          value={pin}
          type="password"
          inputMode="numeric"
          autoComplete="current-password"
          maxLength={6}
          onChange={(event) => setPin(event.target.value.replace(/\D/g, "").slice(0, 6))}
          onKeyDown={(event) => {
            if (event.key === "Enter") void run("login");
          }}
        />
        <Button className="mt-3" disabled={busy} onClick={() => void run("login")}>
          로그인
        </Button>
        <Button variant="ghost" className="mt-2" disabled={busy} onClick={() => void run("register")}>
          처음이에요 (가입)
        </Button>
        <ErrorText>{error}</ErrorText>
      </Card>
      <p className="mt-6 text-center">
        <button type="button" className="text-xs text-sub underline" onClick={onAdmin}>
          운영진
        </button>
      </p>
    </>
  );
}

export function AdminLoginView({
  onSubmit,
  onBack,
}: {
  onSubmit: (pin: string) => Promise<string | null>;
  onBack: () => void;
}) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    setError("");
    try {
      setError((await onSubmit(pin)) ?? "");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Card>
        <h1 className="text-[17px] font-extrabold">운영진 로그인</h1>
        <Label>운영진 비밀번호</Label>
        <Field
          value={pin}
          type="password"
          placeholder="운영진 비밀번호"
          onChange={(event) => setPin(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") void submit();
          }}
        />
        <Button className="mt-3" disabled={busy} onClick={() => void submit()}>
          로그인
        </Button>
        <ErrorText>{error}</ErrorText>
      </Card>
      <p className="mt-6 text-center">
        <button type="button" className="text-xs text-sub underline" onClick={onBack}>
          회원 화면
        </button>
      </p>
    </>
  );
}
