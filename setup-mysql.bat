@echo off
echo ========================================
echo HSM Community - MySQL Migration Setup
echo ========================================
echo.

echo Step 1: Checking MySQL connection...
echo Please ensure MySQL is running and you have updated the DATABASE_URL in .env
echo.
pause

echo.
echo Step 2: Generating Prisma Client...
call npm run db:generate
if %errorlevel% neq 0 (
    echo ERROR: Failed to generate Prisma client
    pause
    exit /b 1
)

echo.
echo Step 3: Pushing schema to MySQL database...
echo This will create all tables in your MySQL database
call npm run db:push
if %errorlevel% neq 0 (
    echo ERROR: Failed to push schema to database
    echo Please check your DATABASE_URL in .env file
    pause
    exit /b 1
)

echo.
echo Step 4: Seeding database with initial data...
call npm run db:seed
if %errorlevel% neq 0 (
    echo ERROR: Failed to seed database
    pause
    exit /b 1
)

echo.
echo ========================================
echo ✅ Setup Complete!
echo ========================================
echo.
echo Your MySQL database is ready with:
echo - Default channels (general, ai-news, memes, projects, help)
echo - Sample events
echo - Sample resources
echo - Admin user (admin@hsm.community / admin123)
echo.
echo Next steps:
echo 1. Start the backend server: npm run server:dev
echo 2. Start the frontend: npm run dev
echo 3. (Optional) Migrate data from Supabase: npm run migrate:from-supabase
echo.
echo For more information, see MIGRATION_STATUS.md
echo.
pause
