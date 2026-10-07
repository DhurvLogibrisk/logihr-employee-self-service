-- =====================================================================
-- Migration 003: Privacy Consent & DPDP Act Compliance
-- =====================================================================

-- Ensure consent columns exist on employees
alter table public.employees
add column if not exists consent_given_at timestamptz,
add column if not exists consent_version text default 'v1.0';

-- Audit table for tracking employee consent history
create table if not exists public.consent_logs (
    id uuid primary key default uuid_generate_v4(),
    employee_id uuid not null references public.employees(id) on delete cascade,
    consent_version text not null default 'v1.0',
    gps_consent boolean not null default true,
    biometric_consent boolean not null default true,
    ip_address text,
    user_agent text,
    consented_at timestamptz not null default now()
);

-- Record employee privacy consent (DPDP Act 2023 compliant)
-- Authenticated caller identity is derived strictly from auth.uid()
create or replace function public.record_employee_consent(
    p_consent_version text default 'v1.0',
    p_ip_address text default null,
    p_user_agent text default null
)
returns jsonb
language plpgsql
security definer
as $$
declare
    v_emp_id uuid;
begin
    -- Derive employee ID from authenticated user
    select id into v_emp_id from public.employees where auth_user_id = auth.uid();
    if v_emp_id is null then
        raise exception 'Authentication required: User not linked to an employee profile.' using errcode = '42501';
    end if;

    -- Update employee profile
    update public.employees
    set consent_given_at = now(),
        consent_version = p_consent_version,
        updated_at = now()
    where id = v_emp_id;

    -- Insert into immutable consent log
    insert into public.consent_logs (employee_id, consent_version, ip_address, user_agent, consented_at)
    values (v_emp_id, p_consent_version, p_ip_address, p_user_agent, now());

    return jsonb_build_object(
        'success', true,
        'message', 'Privacy consent successfully recorded for authenticated employee.',
        'employee_id', v_emp_id,
        'consented_at', now()
    );
end;
$$;
