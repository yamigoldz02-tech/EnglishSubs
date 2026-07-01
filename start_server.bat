@echo off
echo Запуск локального сервера для EnglishSub...
echo.
echo Сервер запущен на порту 8080! Окно браузера откроется автоматически.
echo Пожалуйста, не закрывайте это черное окно, пока занимаетесь на сайте.
echo.
start http://127.0.0.1:8080/index.html
python -m http.server 8080
pause
