# Automated AAB Build Script for Mining Games Rewards App
# This script builds the web app, syncs with Capacitor, and generates a signed AAB file

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "Starting Automated AAB Build Process" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Clean previous build
Write-Host "[1/5] Cleaning previous builds..." -ForegroundColor Yellow
if (Test-Path "dist") {
    Remove-Item -Recurse -Force "dist"
    Write-Host "✓ Cleaned dist folder" -ForegroundColor Green
}
if (Test-Path "android\app\build\outputs\bundle") {
    Remove-Item -Recurse -Force "android\app\build\outputs\bundle"
    Write-Host "✓ Cleaned previous AAB files" -ForegroundColor Green
}
Write-Host ""

# Step 2: Build the web app
Write-Host "[2/5] Building web application..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Web build failed!" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Web build completed successfully" -ForegroundColor Green
Write-Host ""

# Step 3: Sync with Capacitor
Write-Host "[3/5] Syncing with Capacitor Android..." -ForegroundColor Yellow
npx cap sync android
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Capacitor sync failed!" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Capacitor sync completed" -ForegroundColor Green
Write-Host ""

# Step 4: Build signed AAB
Write-Host "[4/5] Building signed AAB file..." -ForegroundColor Yellow
Set-Location android
./gradlew bundleRelease
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ AAB build failed!" -ForegroundColor Red
    Set-Location ..
    exit 1
}
Set-Location ..
Write-Host "✓ AAB build completed successfully" -ForegroundColor Green
Write-Host ""

# Step 5: Locate and display AAB file info
Write-Host "[5/5] Locating AAB file..." -ForegroundColor Yellow
$aabPath = "android\app\build\outputs\bundle\release\app-release.aab"
if (Test-Path $aabPath) {
    $fileInfo = Get-Item $aabPath
    $fileSizeMB = [math]::Round($fileInfo.Length / 1MB, 2)
    
    Write-Host ""
    Write-Host "=====================================" -ForegroundColor Green
    Write-Host "✓ BUILD SUCCESSFUL!" -ForegroundColor Green
    Write-Host "=====================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "AAB File Location:" -ForegroundColor Cyan
    Write-Host "  $aabPath" -ForegroundColor White
    Write-Host ""
    Write-Host "File Size: $fileSizeMB MB" -ForegroundColor Cyan
    Write-Host "Created: $($fileInfo.LastWriteTime)" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Ready to upload to Google Play Console!" -ForegroundColor Green
} else {
    Write-Host "✗ AAB file not found at expected location" -ForegroundColor Red
    exit 1
}
