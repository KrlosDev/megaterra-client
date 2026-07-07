# Database migrations

SQL migrations for the Megaterra Supabase project, applied with the Supabase CLI.

| Project ref | `xpvtnxuhslnyrwllkhka` |
| ----------- | --------------------- |

## Migrations in this folder

Run in timestamp order (the CLI does this automatically):

| File | What it does |
| ---- | ------------ |
| `20260628000001_create_roles.sql` | `roles` table, seeded with `admin` and `executive`. |
| `20260628000002_create_profiles.sql` | `profiles` table (one per auth user) + `id_type` enum (`national_id`, `passport`). |
| `20260628000003_roles_rls_policies.sql` | Enables RLS + `is_admin()`. Everyone reads; admins write. |
| `20260628000004_handle_new_user.sql` | Trigger that auto-creates a profile (`auth_id` + `email`) when an auth user is created. |

## Prerequisites

- Node + `npx` (the CLI runs via `npx supabase`, no global install needed).
- Your Postgres **database password** — found in Dashboard → **Project Settings → Database** (reset it there if unknown). This is **not** the publishable key in `.env.local`.

## Apply the migrations (first time)

Run from the `megaterra-client/` directory:

```bash
# 1. Create supabase/config.toml (keeps the existing migrations/ folder).
#    Answer N when asked to generate Deno / VS Code settings.
npx supabase init

# 2. Authenticate (opens a browser to grab an access token).
npx supabase login

# 3. Link this folder to the hosted project (prompts for the DB password).
npx supabase link --project-ref xpvtnxuhslnyrwllkhka

# 4. Apply all migrations to the hosted DB.
npx supabase db push
```

`db push` runs each file by timestamp and asks for confirmation before applying.

## Adding new migrations later

Once linked, you only repeat the push step:

```bash
# Create a new timestamped migration file:
npx supabase migration new <description>

# ...edit the generated SQL in supabase/migrations/, then:
npx supabase db push
```

## First admin (one-time bootstrap)

RLS only lets admins assign roles, so the very first admin is set manually.

1. Create the user: Dashboard → **Authentication → Users → Add user**. The trigger
   auto-creates their `profiles` row (with `role_id` empty).
2. Promote them in Dashboard → **SQL Editor**:

   ```sql
   update public.profiles
   set role_id = (select id from public.roles where name = 'admin')
   where email = '<your-admin-email>';
   ```

## Verify

```sql
select name from public.roles;                 -- admin, executive
select email, role_id from public.profiles;    -- your admin row, role_id set
```

In the app: signing in loads the full profile into the auth store
(`src/stores/auth-store.ts`); read it with `useAuthStore((s) => s.profile)`
(e.g. `s.profile?.role === "admin"`).

## Notes

- The publishable key and project URL live in `megaterra-client/.env.local`.
- Prefer `npx supabase db push` over pasting SQL in the dashboard, so Supabase
  records applied migrations in `supabase_migrations.schema_migrations` and won't
  try to re-run them.
