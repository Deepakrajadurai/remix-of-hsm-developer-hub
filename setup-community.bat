@echo off
echo ========================================
echo   Community Real-Time Setup Script
echo ========================================
echo.
echo This script will help you set up the real-time community features.
echo.
echo IMPORTANT: You need to run the SQL migration in Supabase first!
echo.
echo Steps:
echo 1. Go to https://supabase.com/dashboard
echo 2. Select your project
echo 3. Click on "SQL Editor" in the left sidebar
echo 4. Click "New Query"
echo 5. Copy the contents of: supabase\migrations\20260120_community_realtime.sql
echo 6. Paste into the SQL Editor
echo 7. Click "Run" button
echo.
echo After running the migration, press any key to continue...
pause >nul
echo.
echo Opening the migration file for you to copy...
echo.
start notepad "supabase\migrations\20260120_community_realtime.sql"
echo.
echo Opening Supabase Dashboard...
start https://supabase.com/dashboard
echo.
echo Once you've run the migration:
echo 1. The app should automatically connect
echo 2. Try creating a post with hashtags
echo 3. Test the real-time chat
echo.
echo Press any key to exit...
pause >nul
