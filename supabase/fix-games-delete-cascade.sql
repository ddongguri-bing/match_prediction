-- 경기 삭제 시 연결된 예측도 함께 삭제되도록 FK 수정
-- Supabase Dashboard → SQL Editor → Run

alter table predictions
  drop constraint if exists predictions_game_id_fkey;

alter table predictions
  add constraint predictions_game_id_fkey
  foreign key (game_id) references games (id) on delete cascade;
