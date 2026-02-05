@echo off
chcp 65001 >nul
echo ========================================
echo 🚀 DEPLOY ANIMEKU TO R2
echo ========================================

REM Build project
echo 📦 Building project...
call npm run build
if errorlevel 1 (
    echo ❌ Build failed!
    pause
    exit /b 1
)

echo ✅ Build complete!

REM Ganti dengan credentials Anda
set R2_ACCOUNT_ID=YOUR_ACCOUNT_ID
set R2_ACCESS_KEY_ID=YOUR_ACCESS_KEY
set R2_SECRET_KEY=YOUR_SECRET_KEY
set R2_BUCKET=animeku

echo ☁️ Uploading to R2...

REM Menggunakan rclone (harus sudah install dan configure)
rclone sync dist r2:%R2_BUCKET% --delete-during --progress

if errorlevel 1 (
    echo ❌ Upload failed!
    echo.
    echo 💡 Tips: Pastikan rclone sudah diinstall dan configured
    echo    Install: https://rclone.org/downloads/
    pause
    exit /b 1
)

echo ✅ Deploy complete!
echo 🌐 Website: https://animeku.xyz
pause
