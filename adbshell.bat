@echo off

rem Get list of connected devices
echo List of connected devices:
adb devices

rem Prompt the user to select a device
set /p selected_device="Enter the device ID to open ADB shell (or type 'exit' to quit): "

rem Check if the user chose to exit
if /i "%selected_device%"=="exit" (
    exit
)

rem Spawn ADB shell for the selected device
adb -s %selected_device% shell