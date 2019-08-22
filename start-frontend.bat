set FRONTEND_PATH=.\frontend

set FRONTEND=npm start

call cd %FRONTEND_PATH%
call %FRONTEND%

pause