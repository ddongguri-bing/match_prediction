"use client";

import { useState } from "react";
import {
  PICK_LABEL,
  PICKS,
  formatClock,
  isPredictionClosed,
  monthDay,
  predictionDeadline,
  weekday,
  type Game,
  type PickSide,
  type Prediction,
} from "@/lib/domain";
import { Button, Card, ErrorText, Notice } from "@/components/ui";

type TodayViewProps = {
  games: Game[];
  predictions: Prediction[];
  now: Date;
  onSave: (gameId: string, pick: PickSide) => void;
};

export function TodayView({ games, predictions, now, onSave }: TodayViewProps) {
  if (games.length === 0) {
    return <Notice>오늘은 경기가 없어요.</Notice>;
  }

  return (
    <>
      {games.map((game) => (
        <TodayGame
          key={game.id}
          game={game}
          prediction={predictions.find((item) => item.gameId === game.id)}
          now={now}
          onSave={onSave}
        />
      ))}
    </>
  );
}

function TodayGame({
  game,
  prediction,
  now,
  onSave,
}: {
  game: Game;
  prediction?: Prediction;
  now: Date;
  onSave: (gameId: string, pick: PickSide) => void;
}) {
  const [pick, setPick] = useState<PickSide | null>(prediction?.pick ?? null);
  const [error, setError] = useState("");
  const closed = isPredictionClosed(game, now);
  const deadline = formatClock(predictionDeadline(game));

  if (game.status === "rain") {
    return <Notice>아쉽지만 오늘은 우천 취소가 됐어요.</Notice>;
  }

  const saved = prediction ? PICK_LABEL[prediction.pick] : null;

  return (
    <Card>
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <p className="text-lg font-extrabold">
          <span className="text-brand">LG</span> vs {game.opponent}
        </p>
        <p className="shrink-0 text-[13px] text-sub">
          {monthDay(game.date)}({weekday(game.date)}) {game.time}
        </p>
      </div>

      {saved ? (
        <div className="rounded-[10px] bg-soft px-3 py-3 text-center">
          <p className="text-[13px] text-sub">내 예측</p>
          <p className="mt-1 text-lg font-extrabold text-brand">{saved}</p>
        </div>
      ) : null}

      {closed ? (
        <p className="mt-3 text-center text-[13px] leading-6 text-sub">
          오늘 승부 예측 가능한 시간이 지났어요.
        </p>
      ) : (
        <>
          <p className="mt-3 text-center text-[13px] text-sub">
            {deadline}까지 예측 가능 · 경기 30분 전 마감
          </p>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {PICKS.map((side) => {
              const selected = pick === side;
              return (
                <button
                  key={side}
                  type="button"
                  aria-pressed={selected}
                  className={`rounded-[10px] border-[1.5px] py-3 text-[15px] font-bold ${
                    selected ? "border-brand bg-brand text-white" : "border-line bg-white text-ink"
                  }`}
                  onClick={() => {
                    setPick(side);
                    setError("");
                  }}
                >
                  {PICK_LABEL[side]}
                </button>
              );
            })}
          </div>
          <Button
            className="mt-3"
            onClick={() => {
              if (!pick) {
                setError("승부 예측을 먼저 골라 주세요.");
                return;
              }
              onSave(game.id, pick);
            }}
          >
            {prediction ? "예측 수정" : "예측 저장"}
          </Button>
          <ErrorText>{error}</ErrorText>
        </>
      )}
    </Card>
  );
}
