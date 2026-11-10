import { PICK_LABEL, historyFor, monthDay, weekday, type Store } from "@/lib/domain";
import { Card, Notice, SectionTitle } from "@/components/ui";

export function HistoryView({ store, memberId }: { store: Store; memberId: string }) {
  const items = historyFor(store, memberId);

  if (items.length === 0) {
    return <Notice>아직 예측 기록이 없어요.</Notice>;
  }

  return (
    <>
      <SectionTitle>예측 기록</SectionTitle>
      <Card className="px-4 py-1">
        {items.map(({ prediction, game, pointsLabel, label, tone, bonus }) => (
          <div
            key={prediction.id}
            className="flex items-center justify-between gap-3 border-b border-line py-3 last:border-b-0"
          >
            <div>
              <p className="font-bold">
                {monthDay(game.date)}({weekday(game.date)}) vs {game.opponent}
              </p>
              <p className="mt-1 text-[13px] text-sub">
                내 예측 {PICK_LABEL[prediction.pick]} · <span className={tone}>{label}</span>
                {bonus > 0 ? (
                  <span className="font-bold text-brand"> · 연속 보너스 +{bonus}</span>
                ) : null}
              </p>
            </div>
            <p className="min-w-11 text-right text-[15px] font-extrabold tabular-nums">{pointsLabel}</p>
          </div>
        ))}
      </Card>
    </>
  );
}
