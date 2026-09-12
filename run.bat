@echo off
SETLOCAL

:: Check if node_modules folder exists
IF NOT EXIST "node_modules" (
    echo Installing dependencies...
    npm install
)

:: Run build and start the bot
echo Building the project...
npm run build:run

ENDLOCAL
pause

