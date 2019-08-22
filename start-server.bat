set SERVER_PATH=.\server

set COMPRESSED_MODEL="[path_to_model.tar.gz]"
set DATA_PATH="%USERPROFILE%\DROP\data"
set PREDICTOR="[predictor-name]"
set CUSTOM_CODE_PATH="[module_parent_path]"
set CUSTOM_MODULE="[module_name]"

set SERVER=python -m server ^
--data-path %DATA_PATH%

call %USERPROFILE%\Anaconda3\Scripts\activate.bat
TIMEOUT 1
call conda activate allennlp
call cd %SERVER_PATH%
call %SERVER%

pause