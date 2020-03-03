@ECHO OFF
SETLOCAL
SET EL=0

ECHO ~~~~~~~~~~~~~~~~~~~~~~~~~~~~ %~f0 ~~~~~~~~~~~~~~~~~~~~~~~~~~~~

IF /I "%msvs_toolset%"=="" ECHO msvs_toolset unset, defaulting to 14 && SET msvs_toolset=14
IF /I "%msvs_version%"=="" ECHO msvs_version unset, defaulting to 2015 && SET msvs_version=2015

SET PATH=%CD%;%PATH%
IF "%msvs_toolset%"=="12" SET msvs_version=2013
IF NOT "%NODE_RUNTIME%"=="" SET "TOOLSET_ARGS=%TOOLSET_ARGS% --runtime=%NODE_RUNTIME%"
IF NOT "%NODE_RUNTIME_VERSION%"=="" SET "TOOLSET_ARGS=%TOOLSET_ARGS% --target=%NODE_RUNTIME_VERSION%"

ECHO APPVEYOR^: %APPVEYOR%
ECHO nodejs_version^: %nodejs_version%
ECHO platform^: %platform%
ECHO msvs_toolset^: %msvs_toolset%
ECHO msvs_version^: %msvs_version%
ECHO TOOLSET_ARGS^: %TOOLSET_ARGS%

ECHO downloading/installing node
powershell Update-NodeJsInstallation (Get-NodeJsLatestBuild $env:nodejs_version) $env:PLATFORM
IF %ERRORLEVEL% NEQ 0 GOTO ERROR

powershell Set-ExecutionPolicy Unrestricted -Scope CurrentUser -Force
IF %ERRORLEVEL% NEQ 0 GOTO ERROR

ECHO available node.exe^:
call where node
ECHO available npm^:
call where npm

ECHO node^: && call node -v
call node -e "console.log('  - arch:',process.arch,'\n  - argv:',process.argv,'\n  - execPath:',process.execPath)"
IF %ERRORLEVEL% NEQ 0 GOTO ERROR

ECHO npm^: && CALL npm -v
IF %ERRORLEVEL% NEQ 0 GOTO ERROR

ECHO ===== where npm puts stuff START ============
ECHO npm root && CALL npm root
IF %ERRORLEVEL% NEQ 0 GOTO ERROR
ECHO npm root -g && CALL npm root -g
IF %ERRORLEVEL% NEQ 0 GOTO ERROR

ECHO npm bin && CALL npm bin
IF %ERRORLEVEL% NEQ 0 GOTO ERROR
ECHO npm bin -g && CALL npm bin -g
IF %ERRORLEVEL% NEQ 0 GOTO ERROR

SET NPM_BIN_DIR=
FOR /F "tokens=*" %%i in ('CALL npm bin -g') DO SET NPM_BIN_DIR=%%i
IF %ERRORLEVEL% NEQ 0 GOTO ERROR
IF /I "%NPM_BIN_DIR%"=="%CD%" ECHO ERROR npm bin -g equals local directory && SET ERRORLEVEL=1 && GOTO ERROR
ECHO ===== where npm puts stuff END ============

IF "%nodejs_version:~0,1%"=="4" CALL npm install node-gyp@3.x
IF %ERRORLEVEL% NEQ 0 GOTO ERROR
IF "%nodejs_version:~0,1%"=="5" CALL npm install node-gyp@3.x
IF %ERRORLEVEL% NEQ 0 GOTO ERROR

::Need to force update node-gyp to v6+ for electron v6 and v5
ECHO ===== conditional node-gyp upgrade START ============
:: Find the folder to install the node-gyp in
SET npm_in_nodejs_dir="%ProgramFiles%\nodejs\node_modules\npm"
ECHO npm_in_nodejs_dir^: %npm_in_nodejs_dir%
IF /I "%platform%"=="x86" SET npm_in_nodejs_dir="%ProgramFiles(x86)%\nodejs\node_modules\npm"
ECHO npm_in_nodejs_dir^: %npm_in_nodejs_dir%
:: Set boolean whether the update has to happen
SET "needs_patch="
IF DEFINED NODE_RUNTIME_VERSION (
  ECHO NODE_RUNTIME_VERSION_REDUCED^: %NODE_RUNTIME_VERSION:~0,1%
  IF "%NODE_RUNTIME_VERSION:~0,1%"=="5" SET "needs_patch=y"
  IF "%NODE_RUNTIME_VERSION:~0,1%"=="6" SET "needs_patch=y"
)
:: Check if electron and install
ECHO NODE_RUNTIME^: %NODE_RUNTIME%
IF DEFINED needs_patch CALL npm install --prefix %npm_in_nodejs_dir% node-gyp@6.x
IF %ERRORLEVEL% NEQ 0 GOTO ERROR
ECHO ===== conditional node-gyp upgrade END ============

:: build MattermoZt
CALL npm install
IF %ERRORLEVEL% NEQ 0 GOTO ERROR
REM CALL npm run package:windows
CALL npm run publish:windows
IF %ERRORLEVEL% NEQ 0 GOTO ERROR




GOTO DONE



:ERROR
ECHO ~~~~~~~~~~~~~~~~~~~~~~ ERROR %~f0 ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
ECHO ERRORLEVEL^: %ERRORLEVEL%
SET EL=%ERRORLEVEL%

:DONE
ECHO ~~~~~~~~~~~~~~~~~~~~~~ DONE %~f0 ~~~~~~~~~~~~~~~~~~~~~~~~~~~~

EXIT /b %EL%
