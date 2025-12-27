@echo off
echo Generating Android keystore for Dart AI app...
echo.

keytool -genkeypair -v -keystore "%~dp0keystore.jks" -keyalg RSA -keysize 2048 -validity 10000 -alias key0 -storepass YOUR_PASSWORD -keypass YOUR_PASSWORD -dname "CN=Dart AI, OU=Mobile, O=Dart AI, L=Your City, ST=Your State, C=US"

echo.
echo Keystore generated successfully!
echo IMPORTANT: Remember your password and keep the keystore file secure!
echo Update keystore.properties with your actual password.
pause