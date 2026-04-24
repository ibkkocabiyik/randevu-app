-- ============================================================
-- Randevu App – Supabase Schema
-- Supabase SQL Editor'da bu dosyayı çalıştır
-- ============================================================

-- UUID extension
create extension if not exists "pgcrypto";

-- ─── SERVICES ────────────────────────────────────────────────
create table if not exists services (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  duration_minutes integer not null check (duration_minutes > 0),
  price         numeric(10,2) not null check (price >= 0),
  category      text not null check (category in ('sac','sakal','bakim')),
  created_at    timestamptz default now()
);

-- ─── EMPLOYEES ───────────────────────────────────────────────
create table if not exists employees (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  avatar        text,
  working_hours_start  time not null default '09:00',
  working_hours_end    time not null default '18:00',
  created_at    timestamptz default now()
);

-- Employee ↔ Service many-to-many
create table if not exists employee_services (
  employee_id   uuid references employees(id) on delete cascade,
  service_id    uuid references services(id) on delete cascade,
  primary key (employee_id, service_id)
);

-- ─── USERS (müşteriler) ──────────────────────────────────────
create table if not exists users (
  id                  uuid primary key default gen_random_uuid(),
  name                text not null,
  email               text unique not null,
  phone               text unique not null,
  password_hash       text not null,
  loyalty_points      integer not null default 0,
  notif_booking_confirmed  boolean not null default true,
  notif_booking_cancelled  boolean not null default true,
  notif_booking_reminder   boolean not null default true,
  notif_review_request     boolean not null default true,
  created_at          timestamptz default now()
);

-- User favourite services
create table if not exists user_favorites (
  user_id     uuid references users(id) on delete cascade,
  service_id  uuid references services(id) on delete cascade,
  primary key (user_id, service_id)
);

-- ─── APPOINTMENTS ────────────────────────────────────────────
create table if not exists appointments (
  id              uuid primary key default gen_random_uuid(),
  customer_id     uuid references users(id) on delete set null,
  customer_name   text not null,
  customer_phone  text not null,
  service_id      uuid not null references services(id),
  employee_id     uuid not null references employees(id),
  date            date not null,
  start_time      time not null,
  end_time        time not null,
  status          text not null default 'pending'
                    check (status in ('pending','confirmed','cancelled','completed','noshow')),
  notes           text,
  created_at      timestamptz default now()
);

create index if not exists idx_appointments_employee_date on appointments(employee_id, date);
create index if not exists idx_appointments_customer on appointments(customer_id);
create index if not exists idx_appointments_status on appointments(status);

-- ─── REVIEWS ─────────────────────────────────────────────────
create table if not exists reviews (
  id              uuid primary key default gen_random_uuid(),
  appointment_id  uuid unique not null references appointments(id) on delete cascade,
  service_id      uuid not null references services(id),
  employee_id     uuid not null references employees(id),
  customer_name   text not null,
  rating          smallint not null check (rating between 1 and 5),
  comment         text not null default '',
  created_at      timestamptz default now()
);

create index if not exists idx_reviews_service on reviews(service_id);
create index if not exists idx_reviews_employee on reviews(employee_id);

-- ─── CUSTOMER NOTES (mini-CRM) ───────────────────────────────
create table if not exists customer_notes (
  id              uuid primary key default gen_random_uuid(),
  customer_phone  text not null,
  text            text not null,
  created_at      timestamptz default now()
);

create index if not exists idx_customer_notes_phone on customer_notes(customer_phone);

-- ─── NOTIFICATIONS ───────────────────────────────────────────
create table if not exists notifications (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid references users(id) on delete cascade,
  type            text not null check (type in (
                    'booking_confirmed','booking_cancelled',
                    'booking_reminder','review_request'
                  )),
  title           text not null,
  body            text not null,
  appointment_id  uuid references appointments(id) on delete cascade,
  read            boolean not null default false,
  created_at      timestamptz default now()
);

create index if not exists idx_notifications_user on notifications(user_id, read);

-- ─── ROW LEVEL SECURITY ──────────────────────────────────────
-- Supabase Realtime için RLS'yi aç ama servis rolüyle bypass et
alter table services          enable row level security;
alter table employees         enable row level security;
alter table employee_services enable row level security;
alter table users             enable row level security;
alter table user_favorites    enable row level security;
alter table appointments      enable row level security;
alter table reviews           enable row level security;
alter table customer_notes    enable row level security;
alter table notifications     enable row level security;

-- Backend (service_role key) tüm tablolara erişebilir — policy gerekmez.
-- Realtime subscription ve frontend için anon okuma politikaları:
create policy "anon read appointments"      on appointments      for select using (true);
create policy "anon read reviews"           on reviews           for select using (true);
create policy "anon read services"          on services          for select using (true);
create policy "anon read employees"         on employees         for select using (true);
create policy "anon read employee_services" on employee_services for select using (true);

-- ─── REALTIME ────────────────────────────────────────────────
-- Supabase Dashboard > Database > Replication'da şu tabloları ekle:
--   appointments, reviews, notifications
-- VEYA:
alter publication supabase_realtime add table appointments;
alter publication supabase_realtime add table reviews;
alter publication supabase_realtime add table services;
alter publication supabase_realtime add table employees;
alter publication supabase_realtime add table notifications;

-- ─── SEED DATA ───────────────────────────────────────────────
-- Servisleri ekle
insert into services (id, name, duration_minutes, price, category) values
  ('a1000000-0000-0000-0000-000000000001', 'Saç Kesimi',        30, 150, 'sac'),
  ('a1000000-0000-0000-0000-000000000002', 'Sakal Düzeltme',    20, 100, 'sakal'),
  ('a1000000-0000-0000-0000-000000000003', 'Saç + Sakal',       45, 220, 'sac'),
  ('a1000000-0000-0000-0000-000000000004', 'Cilt Bakımı',       60, 300, 'bakim'),
  ('a1000000-0000-0000-0000-000000000005', 'Kaş Düzeltme',      15,  80, 'bakim')
on conflict do nothing;

-- Çalışanları ekle
insert into employees (id, name, working_hours_start, working_hours_end) values
  ('b1000000-0000-0000-0000-000000000001', 'Ahmet Usta',   '09:00', '18:00'),
  ('b1000000-0000-0000-0000-000000000002', 'Mehmet Usta',  '10:00', '19:00')
on conflict do nothing;

-- Çalışan-hizmet ilişkileri
insert into employee_services (employee_id, service_id) values
  ('b1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001'),
  ('b1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000002'),
  ('b1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000003'),
  ('b1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000001'),
  ('b1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000004'),
  ('b1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000005')
on conflict do nothing;
