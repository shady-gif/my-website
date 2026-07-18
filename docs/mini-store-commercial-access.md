# Mini Store Commercial Access

Set these server-only environment variables before selling access:

```text
MINI_STORE_SESSION_SECRET=<long random secret>
MINI_STORE_ACCESS_SALT=<long random salt>
SUPABASE_URL=<your supabase project url>
SUPABASE_SERVICE_ROLE_KEY=<server-only service role key>
```

## Supabase Tables

```sql
create table mini_store_licenses (
  id uuid primary key default gen_random_uuid(),
  identity text not null,
  customer_name text,
  access_code_hash text not null,
  allowed_apps text[] not null default '{}',
  active boolean not null default true,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

create table mini_store_download_logs (
  id uuid primary key default gen_random_uuid(),
  identity text not null,
  license_id uuid,
  app_slug text not null,
  platform text not null,
  created_at timestamptz not null default now()
);
```

Hash access codes as:

```text
sha256("<MINI_STORE_ACCESS_SALT>:<customer access code>")
```

Use `allowed_apps = array['mautic']` for one app or `array['*']` for all apps.
