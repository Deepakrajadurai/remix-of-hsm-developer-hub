# Database Migration Guide: Supabase (Postgres) to MySQL

This guide will help you migrate your entire database schema and data from Supabase to a MySQL server.

## Prerequisites

1.  **Python 3** installed.
2.  **Dependencies**: We have attempted to install them for you. If needed, run:
    ```bash
    pip install psycopg2-binary mysql-connector-python
    ```
3.  **Connection Details**:
    *   **Supabase Connection String**: You can find this in your Supabase Dashboard -> Project Settings -> Database -> Connection String -> URI mode.
        *   Format: `postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres`
    *   **MySQL Connection Details**: Host, User, Password, Database Name.

## How to Run the Migration

1.  Open a terminal in the project root.
2.  Run the migration script:
    ```bash
    python scripts/migrate.py
    ```
3.  The script will prompt you for:
    *   Supabase Connection URL.
    *   MySQL Host, User, Password, and Database.
4.  It will automatically:
    *   Connect to both databases.
    *   Detect tables in Supabase.
    *   Create corresponding tables in MySQL (handling type conversion).
    *   Copy all data.

## Post-Migration (Prisma)

If you are using Prisma with this project:

1.  Update your `.env` file with the new `DATABASE_URL` pointing to your MySQL server:
    ```
    DATABASE_URL="mysql://USER:PASSWORD@HOST:PORT/DATABASE"
    ```
2.  Update `prisma/schema.prisma` to use `provider = "mysql"`.
3.  Introspect the new database to update your schema file:
    ```bash
    npx prisma db pull
    ```
4.  Generate the Prisma client:
    ```bash
    npx prisma generate
    ```

## Troubleshooting

-   **Foreign Keys**: The migration script temporarily disables Foreign Key checks during import to avoid ordering issues.
-   **UUIDs**: Supabase uses UUIDs extensively. MySQL doesn't have a native UUID type, so they are converted to `CHAR(36)`.
-   **JSON**: Postgres `JSONB` is converted to MySQL `JSON`.

