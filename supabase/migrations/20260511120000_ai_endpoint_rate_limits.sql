create table if not exists public.ai_endpoint_rate_limits (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  endpoint text not null,
  request_count integer not null default 0 check (request_count >= 0),
  window_start timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, endpoint)
);

create index if not exists ai_endpoint_rate_limits_updated_at_idx
  on public.ai_endpoint_rate_limits(updated_at desc);

drop trigger if exists ai_endpoint_rate_limits_set_updated_at on public.ai_endpoint_rate_limits;
create trigger ai_endpoint_rate_limits_set_updated_at
before update on public.ai_endpoint_rate_limits
for each row execute function public.set_updated_at();

alter table public.ai_endpoint_rate_limits enable row level security;
alter table public.ai_endpoint_rate_limits force row level security;

grant usage on schema public to authenticated, service_role;
grant select, insert, update, delete on public.ai_endpoint_rate_limits to authenticated;
grant all on public.ai_endpoint_rate_limits to service_role;

drop policy if exists ai_endpoint_rate_limits_all_own on public.ai_endpoint_rate_limits;
create policy ai_endpoint_rate_limits_all_own
on public.ai_endpoint_rate_limits
for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create or replace function public.consume_ai_endpoint_rate_limit(
  p_endpoint text,
  p_limit integer,
  p_window_ms integer,
  p_now timestamptz default null
)
returns table (
  allowed boolean,
  request_count integer,
  retry_after_ms bigint,
  window_start timestamptz
)
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_now timestamptz := coalesce(p_now, now());
  v_reset_at timestamptz;
  v_row public.ai_endpoint_rate_limits%rowtype;
begin
  if v_user_id is null then
    raise exception 'Unauthorized';
  end if;

  if p_endpoint is null or btrim(p_endpoint) = '' then
    raise exception 'Endpoint is required';
  end if;

  if coalesce(p_limit, 0) < 1 then
    raise exception 'Rate limit must be greater than zero';
  end if;

  if coalesce(p_window_ms, 0) < 1000 then
    raise exception 'Rate limit window must be at least 1000 ms';
  end if;

  loop
    select *
      into v_row
      from public.ai_endpoint_rate_limits
     where user_id = v_user_id
       and endpoint = p_endpoint
     for update;

    if not found then
      begin
        insert into public.ai_endpoint_rate_limits (
          user_id,
          endpoint,
          request_count,
          window_start,
          created_at,
          updated_at
        )
        values (
          v_user_id,
          p_endpoint,
          1,
          v_now,
          v_now,
          v_now
        );

        return query
        select true, 1, 0::bigint, v_now;
        return;
      exception
        when unique_violation then
          null;
      end;
    else
      v_reset_at := v_row.window_start + make_interval(secs => p_window_ms / 1000.0);

      if v_reset_at <= v_now then
        update public.ai_endpoint_rate_limits
           set request_count = 1,
               window_start = v_now
         where user_id = v_user_id
           and endpoint = p_endpoint;

        return query
        select true, 1, 0::bigint, v_now;
        return;
      end if;

      if v_row.request_count >= p_limit then
        return query
        select
          false,
          v_row.request_count,
          greatest(
            0,
            floor(extract(epoch from (v_reset_at - v_now)) * 1000)::bigint
          ),
          v_row.window_start;
        return;
      end if;

      update public.ai_endpoint_rate_limits
         set request_count = v_row.request_count + 1
       where user_id = v_user_id
         and endpoint = p_endpoint
       returning public.ai_endpoint_rate_limits.request_count, public.ai_endpoint_rate_limits.window_start
            into request_count, window_start;

      return query
      select true, request_count, 0::bigint, window_start;
      return;
    end if;
  end loop;
end;
$$;

grant execute on function public.consume_ai_endpoint_rate_limit(text, integer, integer, timestamptz)
  to authenticated, service_role;
