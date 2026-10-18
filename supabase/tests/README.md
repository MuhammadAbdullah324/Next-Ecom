# SQL behaviour test

Runs the migration and seed on a plain Postgres 15+ with a small stand-in for Supabase's
roles and `auth` schema, then walks through guest cart, checkout, cancel, merge, paid and
failed payments, and checks that RLS keeps users apart. Each check prints `ok:` or an
"expect" line; the script stops on the first unexpected error.

```sh
createdb ne_test
psql -d ne_test -f supabase_shim.sql
psql -d ne_test -f ../migrations/20261018000000_init.sql
psql -d ne_test -f ../seed.sql
psql -d ne_test -At -f checkout_flow.test.sql
```

Do not run `supabase_shim.sql` against a real Supabase project: it creates roles and an `auth` schema that Supabase already has.
