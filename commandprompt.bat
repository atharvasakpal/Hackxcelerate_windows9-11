@echo off
adb devices
echo.
set /p device="Enter the device ID (or type 'exit' to quit): "
echo.
if /i "%device%"=="exit" (
    exit
) else (
    adb -s %device% shell
)