-- =====================================================================
-- Migration 001: LogiHR Baseline Enterprise Schema
-- Timezone: Asia/Kolkata (IST, UTC+05:30)
-- =====================================================================

-- Extensions
create extension if not exists "uuid-ossp";

-- 1. Employees Table
create table if not exists public.employees (
    id uuid primary key default uuid_generate_v4(),
    auth_user_id uuid references auth.users(id) on delete set null,
    emp_code text unique not null,
    name text not null,
    email text unique not null,
    phone text,
    designation text not null,
    department text not null,
    reporting_manager_id uuid references public.employees(id),
    work_location text not null default 'Surat HQ',
    role text not null default 'EMPLOYEE' check (role in ('EMPLOYEE', 'MANAGER', 'HR_ADMIN')),
    shift_name text not null default 'General Day Shift (IST)',
    shift_hours text not null default '09:30 AM - 06:30 PM (9h)',
    shift_start time not null default '09:30:00',
    shift_end time not null default '18:30:00',
    joining_date date not null default current_date,
    avatar_url text,
    is_active boolean not null default true,
    consent_given_at timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- 2. Bound Devices Table
create table if not exists public.devices (
    id uuid primary key default uuid_generate_v4(),
    employee_id uuid not null references public.employees(id) on delete cascade,
    device_id text not null,
    device_model text not null,
    platform text not null,
    is_active boolean not null default true,
    last_seen_at timestamptz not null default now(),
    created_at timestamptz not null default now(),
    unique(employee_id, device_id)
);

-- 3. Office Geofence Sites Table
create table if not exists public.geofence_sites (
    id text primary key,
    name text not null,
    address text not null,
    latitude double precision not null,
    longitude double precision not null,
    radius_meters integer not null default 200,
    city text not null,
    is_active boolean not null default true
);

-- Seed Geofence Sites
insert into public.geofence_sites (id, name, address, latitude, longitude, radius_meters, city)
values
    ('site-surat-hq', 'LogiBrisk HQ (Surat)', '401-404 Titanium Square, Ring Road, Surat, Gujarat 395002', 21.170240, 72.831061, 250, 'Surat'),
    ('site-ahmedabad-hub', 'Ahmedabad Tech Hub', '6th Floor, Pinnacle Business Park, SG Highway, Ahmedabad 380054', 23.022505, 72.571362, 200, 'Ahmedabad'),
    ('site-mumbai-client', 'BKC Client Office (Mumbai)', 'One BKC, G Block, Bandra Kurla Complex, Mumbai 400051', 19.065714, 72.868725, 150, 'Mumbai')
on conflict (id) do nothing;

-- 4. Attendance Punches (Strictly Server-Stamped)
create table if not exists public.punches (
    id uuid primary key default uuid_generate_v4(),
    employee_id uuid not null references public.employees(id) on delete cascade,
    type text not null check (type in ('IN', 'OUT', 'BREAK_IN', 'BREAK_OUT')),
    work_mode text not null default 'OFFICE' check (work_mode in ('OFFICE', 'WFH', 'ON_DUTY')),
    server_timestamp timestamptz not null default now(), -- Authoritative server timestamp only
    punch_date_ist date not null default (now() at time zone 'Asia/Kolkata')::date,
    site_id text references public.geofence_sites(id),
    site_name text not null,
    latitude double precision not null,
    longitude double precision not null,
    accuracy double precision not null,
    distance_meters integer not null,
    is_within_geofence boolean not null default true,
    device_id text not null,
    network_type text not null default 'WiFi',
    selfie_url text,
    offline_queued boolean not null default false,
    received_late boolean not null default false,
    mock_detected boolean not null default false,
    created_at timestamptz not null default now()
);

-- 5. Leave Balances
create table if not exists public.leave_balances (
    id uuid primary key default uuid_generate_v4(),
    employee_id uuid not null references public.employees(id) on delete cascade,
    leave_type text not null,
    leave_code text not null,
    balance numeric(4,1) not null default 0,
    used numeric(4,1) not null default 0,
    total numeric(4,1) not null default 0,
    color text not null default '#3b82f6',
    year integer not null default extract(year from current_date),
    unique(employee_id, leave_code, year)
);

-- 6. Leave Requests
create table if not exists public.leave_requests (
    id uuid primary key default uuid_generate_v4(),
    employee_id uuid not null references public.employees(id) on delete cascade,
    employee_name text not null,
    leave_type text not null,
    leave_type_code text not null,
    from_date timestamptz not null,
    to_date timestamptz not null,
    is_half_day boolean not null default false,
    no_of_days numeric(4,1) not null check (no_of_days > 0),
    reason text not null,
    approver_id uuid references public.employees(id),
    approver_name text not null,
    status text not null default 'PENDING' check (status in ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED')),
    applied_date_ist timestamptz not null default now(),
    decision_date_ist timestamptz,
    manager_comment text,
    attachment_name text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- 7. Holidays Table
create table if not exists public.holidays (
    id text primary key,
    name text not null,
    date date not null unique,
    day_of_week text not null,
    type text not null default 'Gazetted',
    year integer not null default 2026
);

-- Seed 2026 Holidays
insert into public.holidays (id, name, date, day_of_week, type, year)
values
    ('h-1', 'Republic Day', '2026-01-26', 'Monday', 'Gazetted', 2026),
    ('h-2', 'Holi (Dhuleti)', '2026-03-04', 'Wednesday', 'Gazetted', 2026),
    ('h-3', 'Eid-ul-Fitr', '2026-03-20', 'Friday', 'Gazetted', 2026),
    ('h-4', 'Dr. Ambedkar Jayanti', '2026-04-14', 'Tuesday', 'Gazetted', 2026),
    ('h-5', 'Independence Day', '2026-08-15', 'Saturday', 'Gazetted', 2026),
    ('h-6', 'Janmashtami', '2026-09-04', 'Friday', 'Gazetted', 2026),
    ('h-7', 'Gandhi Jayanti', '2026-10-02', 'Friday', 'Gazetted', 2026),
    ('h-8', 'Dussehra', '2026-10-19', 'Monday', 'Gazetted', 2026),
    ('h-9', 'Diwali', '2026-11-08', 'Sunday', 'Gazetted', 2026),
    ('h-10', 'Bestu Varas (New Year)', '2026-11-10', 'Tuesday', 'Gazetted', 2026),
    ('h-11', 'Christmas Day', '2026-12-25', 'Friday', 'Gazetted', 2026)
on conflict (id) do nothing;
