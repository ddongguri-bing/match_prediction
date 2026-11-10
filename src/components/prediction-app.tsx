"use client";

import { useEffect, useState } from "react";
import {
  AdminGamesView,
  AdminMembersView,
  AdminRankView,
} from "@/components/admin-views";
import { HistoryView } from "@/components/history-view";
import { AdminLoginView, LoginView } from "@/components/login-view";
import { TodayView } from "@/components/today-view";
import { api } from "@/lib/api-client";
import { type PickSide, type Store } from "@/lib/domain";

type Session =
  | { role: "member"; memberId: string; name: string }
  | { role: "admin" }
  | null;
type MemberTab = "today" | "history";
type AdminTab = "rank" | "games" | "members";

const emptyStore = (): Store => ({
  today: "",
  members: [],
  games: [],
  predictions: [],
});

export function PredictionApp() {
  const [now, setNow] = useState<Date | null>(null);
  const [store, setStore] = useState<Store>(emptyStore);
  const [session, setSession] = useState<Session>(null);
  const [gate, setGate] = useState<"member" | "admin">("member");
  const [memberTab, setMemberTab] = useState<MemberTab>("today");
  const [adminTab, setAdminTab] = useState<AdminTab>("rank");
  const [toast, setToast] = useState<string | null>(null);
  const [booting, setBooting] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const tick = () => setNow(new Date());
    const immediate = window.setTimeout(tick, 0);
    const timer = window.setInterval(tick, 1000);
    return () => {
      window.clearTimeout(immediate);
      window.clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    void (async () => {
      try {
        const me = await api<{ session: Session }>("/api/auth/me");
        if (!me.session) {
          setSession(null);
          return;
        }
        setSession(me.session);
        if (me.session.role === "member") {
          setMemberTab("today");
          const data = await api<{
            today: string;
            games: Store["games"];
            predictions: Store["predictions"];
            members: Store["members"];
          }>("/api/member/home");
          setStore({
            today: data.today,
            games: data.games,
            predictions: data.predictions,
            members: data.members,
          });
        } else {
          setAdminTab("rank");
          const data = await api<{
            today: string;
            games: Store["games"];
            predictions: Store["predictions"];
            members: Store["members"];
          }>("/api/admin/data");
          setStore({
            today: data.today,
            games: data.games,
            predictions: data.predictions,
            members: data.members,
          });
        }
      } catch {
        setSession(null);
      } finally {
        setBooting(false);
      }
    })();
  }, []);

  function notify(message: string) {
    setToast(message);
    window.setTimeout(() => {
      setToast((current) => (current === message ? null : current));
    }, 1800);
  }

  async function refreshMember() {
    setLoading(true);
    try {
      const data = await api<{
        today: string;
        games: Store["games"];
        predictions: Store["predictions"];
        members: Store["members"];
      }>("/api/member/home");
      setStore({
        today: data.today,
        games: data.games,
        predictions: data.predictions,
        members: data.members,
      });
    } finally {
      setLoading(false);
    }
  }

  async function refreshAdmin() {
    setLoading(true);
    try {
      const data = await api<{
        today: string;
        games: Store["games"];
        predictions: Store["predictions"];
        members: Store["members"];
      }>("/api/admin/data");
      setStore({
        today: data.today,
        games: data.games,
        predictions: data.predictions,
        members: data.members,
      });
    } finally {
      setLoading(false);
    }
  }

  async function login(name: string, pin: string) {
    try {
      const data = await api<{ member: { id: string; name: string } }>(
        "/api/auth/login",
        {
          method: "POST",
          body: JSON.stringify({ name, pin }),
        },
      );
      setSession({
        role: "member",
        memberId: data.member.id,
        name: data.member.name,
      });
      setMemberTab("today");
      await refreshMember();
      return null;
    } catch (error) {
      return error instanceof Error ? error.message : "로그인에 실패했습니다.";
    }
  }

  async function register(name: string, pin: string) {
    try {
      const data = await api<{ member: { id: string; name: string } }>(
        "/api/auth/register",
        {
          method: "POST",
          body: JSON.stringify({ name, pin }),
        },
      );
      setSession({
        role: "member",
        memberId: data.member.id,
        name: data.member.name,
      });
      setMemberTab("today");
      await refreshMember();
      return null;
    } catch (error) {
      return error instanceof Error ? error.message : "가입에 실패했습니다.";
    }
  }

  async function adminLogin(pin: string) {
    try {
      await api("/api/admin/login", {
        method: "POST",
        body: JSON.stringify({ pin }),
      });
      setSession({ role: "admin" });
      setAdminTab("rank");
      await refreshAdmin();
      return null;
    } catch (error) {
      return error instanceof Error ? error.message : "로그인에 실패했습니다.";
    }
  }

  async function logout() {
    await api("/api/auth/logout", { method: "POST" });
    setSession(null);
    setStore(emptyStore());
  }

  async function savePrediction(gameId: string, pick: PickSide) {
    try {
      await api("/api/member/predictions", {
        method: "POST",
        body: JSON.stringify({ gameId, pick }),
      });
      await refreshMember();
      notify("예측이 저장됐어요");
    } catch (error) {
      notify(error instanceof Error ? error.message : "저장에 실패했습니다.");
    }
  }

  async function addGame(input: {
    date: string;
    time: string;
    opponent: string;
  }) {
    try {
      await api("/api/admin/games", {
        method: "POST",
        body: JSON.stringify(input),
      });
      await refreshAdmin();
      notify("일정을 등록했어요");
      return null;
    } catch (error) {
      return error instanceof Error ? error.message : "등록에 실패했습니다.";
    }
  }

  async function updateGame(
    id: string,
    patch: { date: string; time: string; opponent: string },
  ) {
    try {
      await api("/api/admin/games", {
        method: "PATCH",
        body: JSON.stringify({ id, ...patch }),
      });
      await refreshAdmin();
      notify("일정을 수정했어요");
      return null;
    } catch (error) {
      return error instanceof Error ? error.message : "수정에 실패했습니다.";
    }
  }

  async function deleteGame(id: string) {
    try {
      await api("/api/admin/games", {
        method: "DELETE",
        body: JSON.stringify({ id }),
      });
      await refreshAdmin();
    } catch (error) {
      notify(error instanceof Error ? error.message : "삭제에 실패했습니다.");
    }
  }

  async function setGameStatus(
    id: string,
    status: "final" | "rain" | "scheduled",
    result: PickSide | null = null,
  ) {
    try {
      await api("/api/admin/games", {
        method: "PATCH",
        body: JSON.stringify({ id, status, result }),
      });
      await refreshAdmin();
      if (status === "final") notify("결과를 저장했어요");
      if (status === "rain") notify("우천 취소로 저장했어요");
    } catch (error) {
      notify(error instanceof Error ? error.message : "저장에 실패했습니다.");
    }
  }

  async function resetPin(id: string, pin: string) {
    try {
      await api("/api/admin/members", {
        method: "PATCH",
        body: JSON.stringify({ id, pin }),
      });
      await refreshAdmin();
      notify("비밀번호를 변경했어요");
      return null;
    } catch (error) {
      return error instanceof Error ? error.message : "변경에 실패했습니다.";
    }
  }

  async function deleteMember(id: string) {
    try {
      await api("/api/admin/members", {
        method: "DELETE",
        body: JSON.stringify({ id }),
      });
      await refreshAdmin();
    } catch (error) {
      notify(error instanceof Error ? error.message : "삭제에 실패했습니다.");
    }
  }

  const memberName = session?.role === "member" ? session.name : null;
  const todayGames = store.games
    .filter((game) => game.date === store.today)
    .sort((a, b) => a.time.localeCompare(b.time));
  const myPredictions =
    session?.role === "member"
      ? store.predictions.filter((item) => item.memberId === session.memberId)
      : [];

  const tabs =
    session?.role === "admin"
      ? [
          { id: "rank" as const, label: "순위" },
          { id: "games" as const, label: "경기 관리" },
          { id: "members" as const, label: "회원 관리" },
        ]
      : session?.role === "member"
        ? [
            { id: "today" as const, label: "오늘의 예측" },
            { id: "history" as const, label: "내 기록" },
          ]
        : [];

  if (booting || !now) {
    return <div className="min-h-dvh bg-canvas" />;
  }

  return (
    <div className="min-h-dvh bg-canvas text-ink">
      <header className="sticky top-0 z-10 bg-ink text-white">
        <div className="mx-auto w-full max-w-[560px]">
          <div className="flex items-center justify-between gap-3 px-[18px] pt-4">
            <p className="text-lg font-extrabold tracking-tight">
              대유잼 <span className="text-pink">LG</span> 승부 예측
            </p>
            {memberName ? (
              <p className="text-[13px] text-white/80">
                {memberName}
                <button
                  type="button"
                  className="ml-1.5 text-xs text-white underline"
                  onClick={() => void logout()}>
                  로그아웃
                </button>
              </p>
            ) : session?.role === "admin" ? (
              <button
                type="button"
                className="text-xs text-white underline"
                onClick={() => void logout()}>
                로그아웃
              </button>
            ) : null}
          </div>
          {tabs.length > 0 ? (
            <nav className="mt-3 flex w-full">
              {tabs.map((tab) => {
                const selected =
                  session?.role === "admin"
                    ? adminTab === tab.id
                    : memberTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    className={`min-w-0 flex-1 border-b-[3px] px-1 pb-3 pt-2.5 text-[15px] font-semibold leading-tight ${
                      selected
                        ? "border-brand text-white"
                        : "border-transparent text-white/55"
                    }`}
                    onClick={() => {
                      if (session?.role === "admin")
                        setAdminTab(tab.id as AdminTab);
                      else setMemberTab(tab.id as MemberTab);
                    }}>
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          ) : (
            <div className="h-3" />
          )}
        </div>
      </header>

      <main className="mx-auto w-full max-w-[560px] px-3.5 py-4 pb-16">
        {loading ? (
          <p className="mb-3 text-center text-[13px] text-sub">불러오는 중…</p>
        ) : null}

        {session?.role === "member" ? (
          memberTab === "today" ? (
            <TodayView
              games={todayGames}
              predictions={myPredictions}
              now={now}
              onSave={savePrediction}
            />
          ) : (
            <HistoryView store={store} memberId={session.memberId} />
          )
        ) : null}

        {session?.role === "admin" && adminTab === "rank" ? (
          <AdminRankView store={store} />
        ) : null}
        {session?.role === "admin" && adminTab === "games" ? (
          <AdminGamesView
            store={store}
            now={now}
            onAddGame={addGame}
            onUpdateGame={updateGame}
            onDeleteGame={(id) => void deleteGame(id)}
            onSetResult={(id, result) =>
              void setGameStatus(id, "final", result)
            }
            onSetRain={(id) => void setGameStatus(id, "rain")}
            onReopen={(id) => void setGameStatus(id, "scheduled")}
          />
        ) : null}
        {session?.role === "admin" && adminTab === "members" ? (
          <AdminMembersView
            store={store}
            onResetPin={resetPin}
            onDeleteMember={(id) => void deleteMember(id)}
          />
        ) : null}

        {session?.role === "member" ? (
          <p className="mt-6 text-center">
            <button
              type="button"
              className="text-xs text-sub underline"
              onClick={() => {
                void logout().then(() => setGate("admin"));
              }}>
              운영진
            </button>
          </p>
        ) : null}

        {session === null && gate === "member" ? (
          <LoginView
            onLogin={login}
            onRegister={register}
            onAdmin={() => setGate("admin")}
          />
        ) : null}
        {session === null && gate === "admin" ? (
          <AdminLoginView
            onSubmit={adminLogin}
            onBack={() => setGate("member")}
          />
        ) : null}
      </main>

      {toast ? (
        <p className="fixed bottom-6 left-1/2 z-20 -translate-x-1/2 rounded-full bg-ink px-4 py-2.5 text-sm text-white">
          {toast}
        </p>
      ) : null}
    </div>
  );
}
