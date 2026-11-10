export type PickSide = "W" | "D" | "L";
export type GameStatus = "scheduled" | "rain" | "final";

export type Member = {
  id: string;
  name: string;
  pin: string;
};

export type Game = {
  id: string;
  date: string;
  time: string;
  opponent: string;
  status: GameStatus;
  result: PickSide | null;
};

export type Prediction = {
  id: string;
  memberId: string;
  gameId: string;
  pick: PickSide;
};

export type Store = {
  today: string;
  members: Member[];
  games: Game[];
  predictions: Prediction[];
};

export const PICK_LABEL: Record<PickSide, string> = {
  W: "LG 승",
  D: "무승부",
  L: "LG 패",
};

export const PICKS: PickSide[] = ["W", "D", "L"];

export function isPin(value: string) {
  return /^[0-9]{4,6}$/.test(value);
}

export function formatIso(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

export function addDays(iso: string, days: number) {
  const [year, month, day] = iso.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + days);
  return formatIso(date);
}

export function monthDay(iso: string) {
  const [, month, day] = iso.split("-").map(Number);
  return `${month}/${day}`;
}

export function weekday(iso: string) {
  const [year, month, day] = iso.split("-").map(Number);
  return "일월화수목금토"[new Date(year, month - 1, day).getDay()];
}

/** 18:00:00까지 열려 있고, 18:00:01부터 닫힌다. */
export function isPredictionClosed(now: Date) {
  const close = new Date(now);
  close.setHours(18, 0, 1, 0);
  return now.getTime() >= close.getTime();
}

export function canEnterResult(game: Game, today: string, now: Date) {
  if (game.date < today) return true;
  if (game.date > today) return false;
  return isPredictionClosed(now);
}

export function isHit(result: PickSide, pick: PickSide) {
  return result === "D" || pick === result;
}

export type Standing = {
  rank: number;
  member: Member;
  points: number;
  hits: number;
  streak: number;
};

/** 한 경기의 점수 결과. streak는 이 경기 반영 후 연속 성공 수. */
export function scoreGame(
  game: Game,
  prediction: Prediction | null,
  streakBefore: number,
) {
  if (game.status === "rain") {
    return {
      points: 0,
      hitsDelta: 0,
      streak: streakBefore,
      bonus: 0,
      label: "우천 취소" as const,
      tone: "text-[#2563a8]",
      pointsLabel: "-",
    };
  }

  if (game.status !== "final" || !game.result) {
    return {
      points: 0,
      hitsDelta: 0,
      streak: streakBefore,
      bonus: 0,
      label: "결과 대기" as const,
      tone: "text-sub",
      pointsLabel: "대기",
    };
  }

  if (!prediction) {
    return {
      points: 0,
      hitsDelta: 0,
      streak: 0,
      bonus: 0,
      label: "미참여" as const,
      tone: "text-no",
      pointsLabel: "0",
    };
  }

  // 참여 1점. 성공 시 +2, 실패 시 +0. 연속 성공 10·20·30…회마다 +5.
  let points = 1;
  let streak = streakBefore;
  let hitsDelta = 0;
  let bonus = 0;

  if (isHit(game.result, prediction.pick)) {
    points += 2;
    hitsDelta = 1;
    streak += 1;
    if (streak > 0 && streak % 10 === 0) {
      bonus = 5;
      points += bonus;
    }
    return {
      points,
      hitsDelta,
      streak,
      bonus,
      label: "예측 성공" as const,
      tone: "text-ok",
      pointsLabel: `+${points}`,
    };
  }

  return {
    points,
    hitsDelta: 0,
    streak: 0,
    bonus: 0,
    label: "예측 실패" as const,
    tone: "text-no",
    pointsLabel: "+1",
  };
}

export function standings(store: Store): Standing[] {
  const settled = store.games
    .filter((game) => game.status === "final" || game.status === "rain")
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));

  const rows = store.members.map((member) => {
    let points = 0;
    let hits = 0;
    let streak = 0;

    for (const game of settled) {
      const prediction =
        store.predictions.find(
          (item) => item.memberId === member.id && item.gameId === game.id,
        ) ?? null;
      const scored = scoreGame(game, prediction, streak);
      points += scored.points;
      hits += scored.hitsDelta;
      streak = scored.streak;
    }

    return { member, points, hits, streak };
  });

  rows.sort(
    (a, b) =>
      b.points - a.points ||
      b.hits - a.hits ||
      a.member.name.localeCompare(b.member.name, "ko"),
  );

  return rows.map((row, index) => ({ ...row, rank: index + 1 }));
}

export type HistoryItem = {
  prediction: Prediction;
  game: Game;
  pointsLabel: string;
  label: string;
  tone: string;
  bonus: number;
};

export function historyFor(store: Store, memberId: string): HistoryItem[] {
  const mine = store.predictions
    .filter((prediction) => prediction.memberId === memberId)
    .flatMap((prediction) => {
      const game = store.games.find((item) => item.id === prediction.gameId);
      return game ? [{ prediction, game }] : [];
    })
    .sort((a, b) => (a.game.date + a.game.time).localeCompare(b.game.date + b.game.time));

  let streak = 0;
  const scored = mine.map(({ prediction, game }) => {
    const result = scoreGame(game, prediction, streak);
    streak = result.streak;
    return {
      prediction,
      game,
      pointsLabel: result.pointsLabel,
      label: result.label,
      tone: result.tone,
      bonus: result.bonus,
    };
  });

  return scored.reverse();
}

export function outcomeOf(game: Game, pick: PickSide, streakBefore = 0) {
  return scoreGame(game, { id: "", memberId: "", gameId: game.id, pick }, streakBefore);
}

type SeedGame = {
  offset: number;
  time: string;
  opponent: string;
  status: GameStatus;
  result: PickSide | null;
};

const SEED_GAMES: SeedGame[] = [
  { offset: -12, time: "18:30", opponent: "SSG", status: "final", result: "W" },
  { offset: -10, time: "18:30", opponent: "KT", status: "final", result: "L" },
  { offset: -8, time: "14:00", opponent: "삼성", status: "final", result: "W" },
  { offset: -6, time: "18:30", opponent: "한화", status: "rain", result: null },
  { offset: -4, time: "18:30", opponent: "NC", status: "final", result: "D" },
  { offset: -2, time: "14:00", opponent: "KIA", status: "final", result: "W" },
  { offset: -1, time: "18:30", opponent: "롯데", status: "final", result: "L" },
  { offset: 0, time: "18:30", opponent: "두산", status: "scheduled", result: null },
  { offset: 1, time: "14:00", opponent: "SSG", status: "scheduled", result: null },
];

const SEED_MEMBERS: { name: string; picks: (PickSide | null)[] }[] = [
  { name: "김민준", picks: ["W", "L", "W", null, "D", "W", "L"] },
  { name: "이서연", picks: ["W", "L", "W", null, "D", "W", "W"] },
  { name: "박지호", picks: ["W", "L", "W", null, "W", "L", "L"] },
  { name: "최하은", picks: ["W", "L", "L", null, "D", "W", "L"] },
  { name: "정우진", picks: ["L", "W", "W", null, "D", "W", "W"] },
  { name: "한소율", picks: [null, null, "W", null, "D", "W", "L"] },
  { name: "오승현", picks: ["W", "L", null, null, null, "L", "L"] },
  { name: "윤지아", picks: ["W", "W", "L", null, "L", "W", "W"] },
];

export function buildSeed(today: string): Store {
  const games: Game[] = SEED_GAMES.map((game) => ({
    id: `game-${game.offset}`,
    date: addDays(today, game.offset),
    time: game.time,
    opponent: game.opponent,
    status: game.status,
    result: game.result,
  }));

  const members: Member[] = SEED_MEMBERS.map((member) => ({
    id: `member-${member.name}`,
    name: member.name,
    pin: "1234",
  }));

  const predictions: Prediction[] = [];
  members.forEach((member, memberIndex) => {
    SEED_MEMBERS[memberIndex].picks.forEach((pick, gameIndex) => {
      if (!pick) return;
      const game = games[gameIndex];
      if (!game || game.status === "scheduled") return;
      predictions.push({
        id: `${member.id}:${game.id}`,
        memberId: member.id,
        gameId: game.id,
        pick,
      });
    });
  });

  return { today, members, games, predictions };
}
