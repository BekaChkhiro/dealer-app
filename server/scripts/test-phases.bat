@echo off
REM Phase 8-10 Testing Script for Windows
REM Usage: test-phases.bat [command]

setlocal

set COMMAND=%1

if "%COMMAND%"=="" set COMMAND=help

if "%COMMAND%"=="help" goto :help
if "%COMMAND%"=="all" goto :all
if "%COMMAND%"=="phase8" goto :phase8
if "%COMMAND%"=="phase8-users" goto :phase8-users
if "%COMMAND%"=="phase8-vehicles" goto :phase8-vehicles
if "%COMMAND%"=="phase9" goto :phase9
if "%COMMAND%"=="phase10" goto :phase10
if "%COMMAND%"=="coverage" goto :coverage
goto :unknown

:help
echo Phase 8-10 Testing Script
echo.
echo Usage: test-phases.bat [command]
echo.
echo Commands:
echo   all              Run all Phase 8-10 tests
echo   phase8           Run all Phase 8 tests
echo   phase8-users     Run Phase 8 Users tests
echo   phase8-vehicles  Run Phase 8 Vehicles tests
echo   phase9           Run Phase 9 tests
echo   phase10          Run Phase 10 tests
echo   coverage         Run all tests with coverage
echo   help             Show this help message
echo.
goto :end

:all
echo Running all Phase 8-10 tests...
echo.
call npm test -- phase8-users.test.js
if errorlevel 1 goto :failed
echo.
call npm test -- phase8-vehicles.test.js
if errorlevel 1 goto :failed
echo.
call npm test -- phase9-ports-containers.test.js
if errorlevel 1 goto :failed
echo.
call npm test -- phase10-invoices-files.test.js
if errorlevel 1 goto :failed
echo.
echo All Phase 8-10 tests passed!
goto :end

:phase8
echo Running all Phase 8 tests...
echo.
call npm test -- phase8-users.test.js
if errorlevel 1 goto :failed
echo.
call npm test -- phase8-vehicles.test.js
if errorlevel 1 goto :failed
echo.
echo All Phase 8 tests passed!
goto :end

:phase8-users
echo Running Phase 8: Users tests...
call npm test -- phase8-users.test.js
goto :end

:phase8-vehicles
echo Running Phase 8: Vehicles tests...
call npm test -- phase8-vehicles.test.js
goto :end

:phase9
echo Running Phase 9: Ports and Containers tests...
call npm test -- phase9-ports-containers.test.js
goto :end

:phase10
echo Running Phase 10: Invoices and Files tests...
call npm test -- phase10-invoices-files.test.js
goto :end

:coverage
echo Running all tests with coverage...
call npm test -- --coverage --testPathPattern="phase(8|9|10)"
goto :end

:unknown
echo Unknown command: %COMMAND%
echo.
echo Run 'test-phases.bat help' for usage information
goto :end

:failed
echo.
echo Tests failed!
exit /b 1

:end
endlocal
