@echo off
REM Windows wrapper for onchain-helper.sh
REM On Windows, shells are not standard; this wrapper simulates the helper output
REM since cardano-cli is not available in most dev environments anyway.

setlocal enabledelayedexpansion

set "CMD=%1"
shift

REM Parse command-line arguments
set "CAMPAIGN="
set "SIGNING_KEY="
set "ADMIN_SKEY="
set "ISSUER="
set "BENEFICIARY="
set "AMOUNT="

:parse_args
if "%1"=="" goto end_parse
if "%1"=="--campaign" (
  set "CAMPAIGN=%2"
  shift
  shift
  goto parse_args
)
if "%1"=="--signing-key" (
  set "SIGNING_KEY=%2"
  shift
  shift
  goto parse_args
)
if "%1"=="--admin-skey" (
  set "ADMIN_SKEY=%2"
  shift
  shift
  goto parse_args
)
if "%1"=="--issuer" (
  set "ISSUER=%2"
  shift
  shift
  goto parse_args
)
if "%1"=="--beneficiary" (
  set "BENEFICIARY=%2"
  shift
  shift
  goto parse_args
)
if "%1"=="--amount" (
  set "AMOUNT=%2"
  shift
  shift
  goto parse_args
)
shift
goto parse_args

:end_parse

REM Generate a fake tx hash based on campaign, command, and timestamp
for /f "tokens=*" %%A in ('powershell -NoProfile -Command "Get-Random -Minimum 1000000 -Maximum 9999999"') do set "RAND=%%A"
echo simulated-!CMD:-!=!RAND!

endlocal
exit /b 0
