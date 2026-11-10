-- created_at이 null이거나 default가 없을 때 실행
-- Supabase SQL Editor에 붙여넣고 Run

alter table members
  alter column created_at set default now();

alter table members
  alter column created_at set not null;

update members
set created_at = now()
where created_at is null;

alter table games
  alter column created_at set default now();

update games
set created_at = now()
where created_at is null;

alter table predictions
  alter column created_at set default now();

alter table predictions
  alter column updated_at set default now();

update predictions
set created_at = coalesce(created_at, now()),
    updated_at = coalesce(updated_at, now())
where created_at is null or updated_at is null;
