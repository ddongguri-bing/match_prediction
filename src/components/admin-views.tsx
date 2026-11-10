"use client";

import { useState } from "react";
import {
  PICK_LABEL,
  PICKS,
  canEnterResult,
  isPin,
  monthDay,
  standings,
  weekday,
  type Game,
  type Member,
  type PickSide,
  type Store,
} from "@/lib/domain";
import {
  Button,
  Card,
  ErrorText,
  Field,
  Label,
  SectionTitle,
} from "@/components/ui";

const rankTone = ["text-[#d4a017]", "text-[#8d99a6]", "text-[#b0703c]"];

export function AdminRankView({ store }: { store: Store }) {
  const rows = standings(store);

  return (
    <>
      <SectionTitle>전체 {rows.length}명</SectionTitle>
      <div className="mb-3 overflow-hidden rounded-[14px] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="text-left text-xs font-semibold text-sub">
              <th className="px-2 py-2.5">순위</th>
              <th className="px-2 py-2.5">이름</th>
              <th className="px-2 py-2.5 text-right">포인트</th>
              <th className="px-2 py-2.5 text-right">예측 성공</th>
              <th className="px-2 py-2.5 text-right">연속 예측</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.member.id} className="border-t border-line">
                <td
                  className={`px-2 py-3 font-extrabold ${rankTone[row.rank - 1] ?? ""}`}>
                  {row.rank}
                </td>
                <td className="px-2 py-3">{row.member.name}</td>
                <td className="px-2 py-3 text-right font-bold tabular-nums">
                  {row.points}
                </td>
                <td className="px-2 py-3 text-right tabular-nums">
                  {row.hits}
                </td>
                <td className="px-2 py-3 text-right tabular-nums">
                  {row.streak}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-center text-[13px] leading-6 text-sub">
        참여 +1점 · 성공 +2점 · 실패 +0점
        <br />
        연속 성공 10경기마다 +5점 · 우천 취소는 점수 없음(연속 유지)
      </p>
    </>
  );
}

type GameManageProps = {
  store: Store;
  now: Date;
  onAddGame: (input: {
    date: string;
    time: string;
    opponent: string;
  }) => Promise<string | null>;
  onUpdateGame: (
    id: string,
    patch: { date: string; time: string; opponent: string },
  ) => Promise<string | null>;
  onDeleteGame: (id: string) => void;
  onSetResult: (id: string, result: PickSide) => void;
  onSetRain: (id: string) => void;
  onReopen: (id: string) => void;
};

type MemberManageProps = {
  store: Store;
  onResetPin: (id: string, pin: string) => Promise<string | null>;
  onDeleteMember: (id: string) => void;
};

export function AdminGamesView(props: GameManageProps) {
  const games = [...props.store.games].sort((a, b) =>
    (b.date + b.time).localeCompare(a.date + a.time),
  );

  return (
    <>
      <AddGameForm onAdd={props.onAddGame} />
      <SectionTitle>등록된 경기</SectionTitle>
      {games.map((game) => (
        <GameRow
          key={game.id}
          game={game}
          today={props.store.today}
          now={props.now}
          onUpdateGame={props.onUpdateGame}
          onDeleteGame={props.onDeleteGame}
          onSetResult={props.onSetResult}
          onSetRain={props.onSetRain}
          onReopen={props.onReopen}
        />
      ))}
    </>
  );
}

export function AdminMembersView({
  store,
  onResetPin,
  onDeleteMember,
}: MemberManageProps) {
  return (
    <>
      <SectionTitle>회원 {store.members.length}명</SectionTitle>
      <Card className="py-1">
        {store.members.map((member) => (
          <MemberRow
            key={member.id}
            member={member}
            onResetPin={onResetPin}
            onDelete={onDeleteMember}
          />
        ))}
      </Card>
    </>
  );
}

function AddGameForm({ onAdd }: { onAdd: GameManageProps["onAddGame"] }) {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [opponent, setOpponent] = useState("");
  const [error, setError] = useState("");

  return (
    <>
      <SectionTitle>경기 일정 등록</SectionTitle>
      <Card>
        <div className="grid grid-cols-2 gap-2">
          <Field
            type="date"
            value={date}
            aria-label="날짜"
            onChange={(event) => setDate(event.target.value)}
          />
          <Field
            type="time"
            value={time}
            aria-label="시간"
            onChange={(event) => setTime(event.target.value)}
          />
        </div>
        <Label>상대팀</Label>
        <Field
          value={opponent}
          placeholder="예) 두산"
          onChange={(event) => setOpponent(event.target.value)}
        />
        <Button
          className="mt-3"
          onClick={() => {
            void (async () => {
              const message = await onAdd({ date, time, opponent });
              setError(message ?? "");
              if (!message) {
                setDate("");
                setTime("");
                setOpponent("");
              }
            })();
          }}>
          일정 등록
        </Button>
        <ErrorText>{error}</ErrorText>
      </Card>
    </>
  );
}

function GameRow({
  game,
  today,
  now,
  onUpdateGame,
  onDeleteGame,
  onSetResult,
  onSetRain,
  onReopen,
}: {
  game: Game;
  today: string;
  now: Date;
} & Pick<
  GameManageProps,
  "onUpdateGame" | "onDeleteGame" | "onSetResult" | "onSetRain" | "onReopen"
>) {
  const [editing, setEditing] = useState(false);
  const [date, setDate] = useState(game.date);
  const [time, setTime] = useState(game.time);
  const [opponent, setOpponent] = useState(game.opponent);
  const [result, setResult] = useState<PickSide | "">("");
  const [error, setError] = useState("");
  const resultReady = canEnterResult(game, today, now);
  const isToday = game.date === today;

  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-extrabold">
            {isToday ? <span className="mr-1 text-brand">오늘</span> : null}
            {monthDay(game.date)}({weekday(game.date)}) {game.time}
          </p>
          <p className="mt-1 text-sm">vs {game.opponent}</p>
        </div>
        <StatusTag game={game} />
      </div>

      {editing ? (
        <div className="mt-3">
          <div className="grid grid-cols-2 gap-2">
            <Field
              type="date"
              value={date}
              aria-label="날짜 수정"
              onChange={(event) => setDate(event.target.value)}
            />
            <Field
              type="time"
              value={time}
              aria-label="시간 수정"
              onChange={(event) => setTime(event.target.value)}
            />
          </div>
          <Label>상대팀</Label>
          <Field
            value={opponent}
            onChange={(event) => setOpponent(event.target.value)}
          />
          <div className="mt-3 flex gap-2">
            <Button
              variant="small"
              onClick={() => {
                void (async () => {
                  const message = await onUpdateGame(game.id, {
                    date,
                    time,
                    opponent,
                  });
                  setError(message ?? "");
                  if (!message) setEditing(false);
                })();
              }}>
              수정 저장
            </Button>
            <Button variant="smallGhost" onClick={() => setEditing(false)}>
              취소
            </Button>
          </div>
        </div>
      ) : (
        <div className="mt-3 flex flex-wrap gap-2">
          <Button variant="smallGhost" onClick={() => setEditing(true)}>
            일정 수정
          </Button>
          <Button
            variant="smallGhost"
            onClick={() => {
              if (window.confirm("이 경기를 삭제할까요?"))
                onDeleteGame(game.id);
            }}>
            삭제
          </Button>
        </div>
      )}

      {game.status === "final" || game.status === "rain" ? (
        <div className="mt-3">
          <Button variant="smallGhost" onClick={() => onReopen(game.id)}>
            예정으로 되돌리기
          </Button>
        </div>
      ) : null}

      {game.status === "scheduled" && resultReady ? (
        <div className="mt-3 border-t border-line pt-3">
          <p className="text-[13px] font-bold text-sub">당일 결과 입력</p>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {PICKS.map((side) => (
              <button
                key={side}
                type="button"
                aria-pressed={result === side}
                className={`rounded-[10px] border-[1.5px] py-2 text-[13px] font-bold ${
                  result === side
                    ? "border-brand bg-brand text-white"
                    : "border-line bg-white"
                }`}
                onClick={() => setResult(side)}>
                {PICK_LABEL[side]}
              </button>
            ))}
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            <Button
              variant="small"
              onClick={() => {
                if (!result) {
                  setError("결과를 선택해 주세요.");
                  return;
                }
                setError("");
                onSetResult(game.id, result);
              }}>
              결과 저장
            </Button>
            <Button variant="smallGhost" onClick={() => onSetRain(game.id)}>
              우천 취소
            </Button>
          </div>
        </div>
      ) : null}

      {game.status === "scheduled" && !resultReady ? (
        <p className="mt-3 text-[13px] text-sub">
          {game.date > today
            ? "경기일 이후에 결과를 입력할 수 있어요."
            : "경기 시작 4시간 이후에 결과를 입력할 수 있어요."}
        </p>
      ) : null}

      {game.status === "scheduled" && isToday && !resultReady ? (
        <div className="mt-2">
          <Button variant="smallGhost" onClick={() => onSetRain(game.id)}>
            우천 취소
          </Button>
        </div>
      ) : null}

      <ErrorText>{error}</ErrorText>
    </Card>
  );
}

function StatusTag({ game }: { game: Game }) {
  if (game.status === "rain") {
    return (
      <span className="rounded-full bg-[#e6f0fb] px-2 py-1 text-xs font-bold text-[#2563a8]">
        우천
      </span>
    );
  }
  if (game.status === "final" && game.result) {
    return (
      <span className="rounded-full bg-soft px-2 py-1 text-xs font-bold text-brand">
        {PICK_LABEL[game.result]}
      </span>
    );
  }
  return (
    <span className="rounded-full bg-canvas px-2 py-1 text-xs font-bold text-sub">
      예정
    </span>
  );
}

function MemberRow({
  member,
  onResetPin,
  onDelete,
}: {
  member: Member;
  onResetPin: (id: string, pin: string) => Promise<string | null>;
  onDelete: (id: string) => void;
}) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");

  return (
    <div className="border-b border-line py-3 last:border-b-0">
      <div className="flex items-center justify-between gap-3">
        <p className="font-bold">{member.name}</p>
        <Button
          variant="smallGhost"
          onClick={() => {
            if (window.confirm(`${member.name} 회원을 삭제할까요?`))
              onDelete(member.id);
          }}>
          삭제
        </Button>
      </div>
      <div className="mt-2 flex gap-2">
        <Field
          className="min-w-0 flex-1"
          value={pin}
          inputMode="numeric"
          maxLength={6}
          placeholder="새 비밀번호 4~6자리"
          aria-label={`${member.name} 새 비밀번호`}
          onChange={(event) =>
            setPin(event.target.value.replace(/\D/g, "").slice(0, 6))
          }
        />
        <Button
          variant="small"
          className="shrink-0"
          onClick={() => {
            if (!isPin(pin)) {
              setError("숫자 4자리에서 6자리로 입력해 주세요.");
              return;
            }
            void (async () => {
              const message = await onResetPin(member.id, pin);
              setError(message ?? "");
              if (!message) setPin("");
            })();
          }}>
          변경
        </Button>
      </div>
      <ErrorText>{error}</ErrorText>
    </div>
  );
}
