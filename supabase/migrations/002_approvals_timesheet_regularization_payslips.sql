-- =====================================================================
-- Migration 002: Approvals, Timesheets, Regularizations, and Payslips
-- =====================================================================

-- 1. Regularizations Table
create table if not exists public.regularizations (
    id uuid primary key default uuid_generate_v4(),
    employee_id uuid not null references public.employees(id) on delete cascade,
    employee_name text not null,
    date date not null,
    punch_type text not null check (punch_type in ('In', 'Out', 'Both')),
    proposed_in_time text,
    proposed_out_time text,
    reason text not null,
    approver_id uuid references public.employees(id),
    status text not null default 'PENDING' check (status in ('PENDING', 'APPROVED', 'REJECTED')),
    manager_comment text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- 2. Timesheets Table
create table if not exists public.timesheets (
    id uuid primary key default uuid_generate_v4(),
    employee_id uuid not null references public.employees(id) on delete cascade,
    date date not null,
    total_hours text not null default '00:00',
    total_minutes integer not null default 0,
    rows jsonb not null default '[]'::jsonb,
    status text not null default 'DRAFT' check (status in ('DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED')),
    submitted_at timestamptz,
    approved_at timestamptz,
    approver_id uuid references public.employees(id),
    manager_comment text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique(employee_id, date)
);

-- 3. Timesheet Detail Rows Table
create table if not exists public.timesheet_rows (
    id uuid primary key default uuid_generate_v4(),
    timesheet_id uuid not null references public.timesheets(id) on delete cascade,
    start_time text not null, -- HH:MM
    end_time text not null, -- HH:MM
    hours text not null, -- HH:MM
    hours_decimal numeric(4,2) not null,
    task_no text not null,
    modual_task_activity text not null,
    description text not null,
    created_at timestamptz not null default now()
);

-- 4. Payslips Table (Real Salary Statements with RLS)
create table if not exists public.payslips (
    id uuid primary key default uuid_generate_v4(),
    employee_id uuid not null references public.employees(id) on delete cascade,
    month text not null, -- YYYY-MM
    month_name text not null, -- September 2026
    year integer not null,
    gross_salary numeric(10,2) not null,
    net_pay numeric(10,2) not null,
    deductions numeric(10,2) not null default 0,
    pf numeric(10,2) not null default 0,
    tax numeric(10,2) not null default 0,
    paid_days integer not null default 30,
    generated_date date not null default current_date,
    pdf_url text,
    created_at timestamptz not null default now(),
    unique(employee_id, month)
);

-- Indexes
create index if not exists idx_punches_employee_date on public.punches(employee_id, punch_date_ist);
create index if not exists idx_leave_requests_employee on public.leave_requests(employee_id, status);
create index if not exists idx_timesheets_employee_date on public.timesheets(employee_id, date);
create index if not exists idx_payslips_employee on public.payslips(employee_id);

-- =====================================================================
-- RLS HELPER FUNCTIONS & POLICIES
-- =====================================================================

-- Get current authenticated employee ID
create or replace function public.get_current_employee_id()
returns uuid
language sql
stable
security definer
as $$
    select id from public.employees where auth_user_id = auth.uid() limit 1;
$$;

-- Check if user is manager of employee or HR Admin
create or replace function public.is_manager_of(p_manager_id uuid, p_employee_id uuid)
returns boolean
language sql
stable
security definer
as $$
    select exists (
        select 1 from public.employees e
        join public.employees m on m.id = p_manager_id
        where e.id = p_employee_id
        and (
            e.reporting_manager_id = p_manager_id
            or m.role = 'HR_ADMIN'
        )
    );
$$;

-- Enable RLS
alter table public.payslips enable row level security;
alter table public.timesheets enable row level security;
alter table public.timesheet_rows enable row level security;
alter table public.regularizations enable row level security;
alter table public.leave_requests enable row level security;

-- Payslips: Employee can only view their own rows
create policy "Employees can view own payslips"
    on public.payslips
    for select
    using (employee_id = public.get_current_employee_id());

-- Leave Requests RLS: Own rows + Manager oversight
create policy "Employees and managers can view leave requests"
    on public.leave_requests
    for select
    using (
        employee_id = public.get_current_employee_id()
        or public.is_manager_of(public.get_current_employee_id(), employee_id)
    );

create policy "Employees can insert own leave requests"
    on public.leave_requests
    for insert
    with check (employee_id = public.get_current_employee_id());

create policy "Employees can cancel own pending leave requests"
    on public.leave_requests
    for update
    using (employee_id = public.get_current_employee_id() and status = 'PENDING')
    with check (status = 'CANCELLED');

-- Regularizations RLS: Own rows + Manager oversight
create policy "Employees and managers can view regularizations"
    on public.regularizations
    for select
    using (
        employee_id = public.get_current_employee_id()
        or public.is_manager_of(public.get_current_employee_id(), employee_id)
    );

create policy "Employees can insert own regularizations"
    on public.regularizations
    for insert
    with check (employee_id = public.get_current_employee_id());

-- Timesheets RLS: Own draft/submission + Manager review
create policy "Employees and managers can view timesheets"
    on public.timesheets
    for select
    using (
        employee_id = public.get_current_employee_id()
        or public.is_manager_of(public.get_current_employee_id(), employee_id)
    );

create policy "Employees can insert own timesheets"
    on public.timesheets
    for insert
    with check (employee_id = public.get_current_employee_id());

create policy "Employees can update own draft or rejected timesheets"
    on public.timesheets
    for update
    using (
        employee_id = public.get_current_employee_id()
        and status in ('DRAFT', 'REJECTED')
    );

-- Timesheet Rows RLS
create policy "Employees and managers can view timesheet rows"
    on public.timesheet_rows
    for select
    using (
        exists (
            select 1 from public.timesheets t
            where t.id = timesheet_id
            and (
                t.employee_id = public.get_current_employee_id()
                or public.is_manager_of(public.get_current_employee_id(), t.employee_id)
            )
        )
    );

create policy "Employees can manage own timesheet rows"
    on public.timesheet_rows
    for all
    using (
        exists (
            select 1 from public.timesheets t
            where t.id = timesheet_id
            and t.employee_id = public.get_current_employee_id()
            and t.status in ('DRAFT', 'REJECTED')
        )
    );

-- Punches RLS
alter table public.punches enable row level security;
create policy "Employees and managers can view punches"
    on public.punches
    for select
    using (
        employee_id = public.get_current_employee_id()
        or public.is_manager_of(public.get_current_employee_id(), employee_id)
    );

-- =====================================================================
-- TRANSACTIONAL APPROVAL & REJECTION FUNCTIONS (SECURITY DEFINER)
-- Caller identity is STRICTLY derived from auth.uid() - never trusted from client
-- =====================================================================

-- 1. Transactional Leave Approval with Balance Deduction
create or replace function public.approve_leave_request(
    p_request_id uuid,
    p_comment text default 'Approved'
)
returns jsonb
language plpgsql
security definer
as $$
declare
    v_caller_id uuid;
    v_caller_role text;
    v_req record;
    v_balance record;
begin
    -- 1. Derive caller from authenticated session
    select id, role into v_caller_id, v_caller_role
    from public.employees
    where auth_user_id = auth.uid();

    if v_caller_id is null then
        raise exception 'Authentication required: Caller is not linked to an employee profile.' using errcode = '42501';
    end if;

    -- 2. Fetch leave request with row locking
    select * into v_req from public.leave_requests where id = p_request_id for update;
    if not found then
        return jsonb_build_object('success', false, 'error', 'Leave request not found');
    end if;

    if v_req.status <> 'PENDING' then
        return jsonb_build_object('success', false, 'error', 'Leave request is not in PENDING status');
    end if;

    -- 3. STRICT ANTI-SELF-APPROVAL RULE
    if v_req.employee_id = v_caller_id then
        raise exception 'SECURITY VIOLATION: Employees cannot approve their own leave request.' using errcode = '42501';
    end if;

    -- 4. Manager / HR authorization check
    if v_caller_role <> 'HR_ADMIN' and not public.is_manager_of(v_caller_id, v_req.employee_id) then
        raise exception 'SECURITY VIOLATION: Caller is not authorized to approve requests for this employee.' using errcode = '42501';
    end if;

    -- 5. Update Leave Request Status
    update public.leave_requests
    set status = 'APPROVED',
        approver_id = v_caller_id,
        decision_date_ist = now(),
        manager_comment = p_comment,
        updated_at = now()
    where id = p_request_id;

    -- 6. Transactionally deduct leave balance (unless LWP)
    if v_req.leave_type_code <> 'LEAVE_WITHOUT_PAY' then
        select * into v_balance from public.leave_balances
        where employee_id = v_req.employee_id
        and leave_code = v_req.leave_type_code
        for update;

        if found then
            if (v_balance.balance - v_req.no_of_days) < 0 then
                raise exception 'Insufficient leave balance for deduction.' using errcode = '23514';
            end if;

            update public.leave_balances
            set used = used + v_req.no_of_days,
                balance = total - (used + v_req.no_of_days)
            where id = v_balance.id;
        end if;
    end if;

    return jsonb_build_object(
        'success', true,
        'message', 'Leave request approved and balance updated transactionally.',
        'request_id', p_request_id,
        'approver_id', v_caller_id
    );
end;
$$;

-- 2. Reject Leave Request
create or replace function public.reject_leave_request(
    p_request_id uuid,
    p_comment text default 'Rejected'
)
returns jsonb
language plpgsql
security definer
as $$
declare
    v_caller_id uuid;
    v_caller_role text;
    v_req record;
begin
    select id, role into v_caller_id, v_caller_role
    from public.employees
    where auth_user_id = auth.uid();

    if v_caller_id is null then
        raise exception 'Authentication required.' using errcode = '42501';
    end if;

    select * into v_req from public.leave_requests where id = p_request_id for update;
    if not found or v_req.status <> 'PENDING' then
        return jsonb_build_object('success', false, 'error', 'Invalid leave request');
    end if;

    if v_req.employee_id = v_caller_id then
        raise exception 'SECURITY VIOLATION: Employees cannot reject their own leave.' using errcode = '42501';
    end if;

    if v_caller_role <> 'HR_ADMIN' and not public.is_manager_of(v_caller_id, v_req.employee_id) then
        raise exception 'SECURITY VIOLATION: Caller is not authorized.' using errcode = '42501';
    end if;

    update public.leave_requests
    set status = 'REJECTED',
        approver_id = v_caller_id,
        decision_date_ist = now(),
        manager_comment = p_comment,
        updated_at = now()
    where id = p_request_id;

    return jsonb_build_object('success', true, 'message', 'Leave request rejected.');
end;
$$;

-- 3. Approve Regularization
create or replace function public.approve_regularization(
    p_regularization_id uuid,
    p_comment text default 'Approved'
)
returns jsonb
language plpgsql
security definer
as $$
declare
    v_caller_id uuid;
    v_caller_role text;
    v_reg record;
begin
    select id, role into v_caller_id, v_caller_role
    from public.employees
    where auth_user_id = auth.uid();

    if v_caller_id is null then
        raise exception 'Authentication required.' using errcode = '42501';
    end if;

    select * into v_reg from public.regularizations where id = p_regularization_id for update;
    if not found or v_reg.status <> 'PENDING' then
        return jsonb_build_object('success', false, 'error', 'Invalid regularization');
    end if;

    if v_reg.employee_id = v_caller_id then
        raise exception 'SECURITY VIOLATION: Employees cannot approve their own regularization.' using errcode = '42501';
    end if;

    if v_caller_role <> 'HR_ADMIN' and not public.is_manager_of(v_caller_id, v_reg.employee_id) then
        raise exception 'SECURITY VIOLATION: Caller is not authorized.' using errcode = '42501';
    end if;

    update public.regularizations
    set status = 'APPROVED',
        approver_id = v_caller_id,
        manager_comment = p_comment,
        updated_at = now()
    where id = p_regularization_id;

    return jsonb_build_object('success', true, 'message', 'Regularization approved.');
end;
$$;

-- 4. Reject Regularization
create or replace function public.reject_regularization(
    p_regularization_id uuid,
    p_comment text default 'Rejected'
)
returns jsonb
language plpgsql
security definer
as $$
declare
    v_caller_id uuid;
    v_caller_role text;
    v_reg record;
begin
    select id, role into v_caller_id, v_caller_role
    from public.employees
    where auth_user_id = auth.uid();

    if v_caller_id is null then
        raise exception 'Authentication required.' using errcode = '42501';
    end if;

    select * into v_reg from public.regularizations where id = p_regularization_id for update;
    if not found or v_reg.status <> 'PENDING' then
        return jsonb_build_object('success', false, 'error', 'Invalid regularization request');
    end if;

    if v_reg.employee_id = v_caller_id then
        raise exception 'SECURITY VIOLATION: Employees cannot reject their own regularization.' using errcode = '42501';
    end if;

    if v_caller_role <> 'HR_ADMIN' and not public.is_manager_of(v_caller_id, v_reg.employee_id) then
        raise exception 'SECURITY VIOLATION: Caller is not authorized.' using errcode = '42501';
    end if;

    update public.regularizations
    set status = 'REJECTED',
        approver_id = v_caller_id,
        manager_comment = p_comment,
        updated_at = now()
    where id = p_regularization_id;

    return jsonb_build_object('success', true, 'message', 'Regularization rejected.');
end;
$$;

-- 5. Approve Timesheet
create or replace function public.approve_timesheet(
    p_timesheet_id uuid,
    p_comment text default 'Approved'
)
returns jsonb
language plpgsql
security definer
as $$
declare
    v_caller_id uuid;
    v_caller_role text;
    v_ts record;
begin
    select id, role into v_caller_id, v_caller_role
    from public.employees
    where auth_user_id = auth.uid();

    if v_caller_id is null then
        raise exception 'Authentication required.' using errcode = '42501';
    end if;

    select * into v_ts from public.timesheets where id = p_timesheet_id for update;
    if not found or v_ts.status <> 'SUBMITTED' then
        return jsonb_build_object('success', false, 'error', 'Invalid timesheet');
    end if;

    if v_ts.employee_id = v_caller_id then
        raise exception 'SECURITY VIOLATION: Employees cannot approve their own timesheet.' using errcode = '42501';
    end if;

    if v_caller_role <> 'HR_ADMIN' and not public.is_manager_of(v_caller_id, v_ts.employee_id) then
        raise exception 'SECURITY VIOLATION: Caller is not authorized.' using errcode = '42501';
    end if;

    update public.timesheets
    set status = 'APPROVED',
        approved_at = now(),
        approver_id = v_caller_id,
        manager_comment = p_comment,
        updated_at = now()
    where id = p_timesheet_id;

    return jsonb_build_object('success', true, 'message', 'Timesheet approved.');
end;
$$;

-- 6. Reject Timesheet
create or replace function public.reject_timesheet(
    p_timesheet_id uuid,
    p_comment text default 'Rejected'
)
returns jsonb
language plpgsql
security definer
as $$
declare
    v_caller_id uuid;
    v_caller_role text;
    v_ts record;
begin
    select id, role into v_caller_id, v_caller_role
    from public.employees
    where auth_user_id = auth.uid();

    if v_caller_id is null then
        raise exception 'Authentication required.' using errcode = '42501';
    end if;

    select * into v_ts from public.timesheets where id = p_timesheet_id for update;
    if not found or v_ts.status <> 'SUBMITTED' then
        return jsonb_build_object('success', false, 'error', 'Invalid timesheet');
    end if;

    if v_ts.employee_id = v_caller_id then
        raise exception 'SECURITY VIOLATION: Employees cannot reject their own timesheet.' using errcode = '42501';
    end if;

    if v_caller_role <> 'HR_ADMIN' and not public.is_manager_of(v_caller_id, v_ts.employee_id) then
        raise exception 'SECURITY VIOLATION: Caller is not authorized.' using errcode = '42501';
    end if;

    update public.timesheets
    set status = 'REJECTED',
        approver_id = v_caller_id,
        manager_comment = p_comment,
        updated_at = now()
    where id = p_timesheet_id;

    return jsonb_build_object('success', true, 'message', 'Timesheet rejected.');
end;
$$;

-- 7. Column Protection Trigger for Employee Profile
create or replace function public.fn_protect_employee_columns()
returns trigger
language plpgsql
as $$
begin
    if auth.role() = 'authenticated' then
        if old.role is distinct from new.role or
           old.reporting_manager_id is distinct from new.reporting_manager_id then
            raise exception 'SECURITY VIOLATION: Employees cannot modify their own role or reporting manager.' using errcode = '42501';
        end if;
    end if;
    return new;
end;
$$;

drop trigger if exists trg_protect_employee_columns on public.employees;
create trigger trg_protect_employee_columns
    before update on public.employees
    for each row
    execute function public.fn_protect_employee_columns();
