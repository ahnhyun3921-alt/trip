-- 상하이·항저우 가족여행 : Supabase SQL Editor에 그대로 붙여 실행하세요.

create table if not exists days (
  id uuid primary key default gen_random_uuid(),
  n int not null unique,                -- 1, 2, 3 ...
  date date,                            -- 여행 날짜 (정하면 '오늘' 계산에 씀)
  city text not null,
  title text not null default '',
  moves jsonb not null default '[]',    -- 큰 이동 표시 [{kind:'plane'|'train'|'hotel', text}]
  hotel jsonb                           -- {name, zhName, zhAddress, lng, lat}
);

create table if not exists blocks (
  id uuid primary key default gen_random_uuid(),
  day_id uuid not null references days(id) on delete cascade,
  position int not null default 0,
  type text not null default 'tour',    -- tour | food | shop | move | stay
  name text not null,
  zh_name text,
  zh_address text,
  lng double precision,                 -- 고덕(GCJ-02) 좌표
  lat double precision,
  start_time text,                      -- 'HH:MM'
  duration_text text,                   -- 적은 그대로: '1시간 30분'
  duration_min int,                     -- 읽어낸 분
  note text,                            -- 장소 특이사항 (AI가 참고)
  memo text,
  important boolean not null default false,
  todos jsonb not null default '[]',    -- [{id, text, done}]
  reservation jsonb,                    -- {owner, url, number, status, capture}
  travel jsonb,                         -- 이전 블록에서 오는 이동 {fromId, mode, minutes, text}
  updated_by text,
  updated_at timestamptz not null default now()
);
create index if not exists blocks_day_pos on blocks(day_id, position);

create table if not exists expenses (
  id uuid primary key default gen_random_uuid(),
  day_id uuid references days(id) on delete set null,
  block_id uuid references blocks(id) on delete set null,
  label text not null,
  category text not null,               -- 식비 | 교통 | 입장료 | 쇼핑 | 숙박 | 기타
  amount numeric not null,              -- 위안
  created_by text,
  created_at timestamptz not null default now()
);

create table if not exists changes (
  id uuid primary key default gen_random_uuid(),
  day_n int,
  summary text not null,                -- '상하이 박물관 빠짐 · 난징둥루 13:50'
  actor text,
  created_at timestamptz not null default now()
);

-- 가족끼리만 쓰는 앱이라 로그인 없이 anon 키로 읽고 씁니다.
-- 링크와 키가 밖으로 새지 않게만 주의하세요.
alter table days enable row level security;
alter table blocks enable row level security;
alter table expenses enable row level security;
alter table changes enable row level security;
do $$ begin
  create policy "family all" on days for all using (true) with check (true);
  create policy "family all" on blocks for all using (true) with check (true);
  create policy "family all" on expenses for all using (true) with check (true);
  create policy "family all" on changes for all using (true) with check (true);
exception when duplicate_object then null; end $$;

-- 실시간 반영
alter publication supabase_realtime add table blocks, expenses, changes, days;

-- 예약 확인 캡처 저장소
insert into storage.buckets (id, name, public) values ('captures', 'captures', true)
on conflict (id) do nothing;
do $$ begin
  create policy "family captures" on storage.objects for all
    using (bucket_id = 'captures') with check (bucket_id = 'captures');
exception when duplicate_object then null; end $$;
