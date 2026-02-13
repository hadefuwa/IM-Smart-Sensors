@echo off
echo Starting IO-Link Master Interface...
echo.
echo Backend server will start on http://localhost:8080
echo Open your browser to: http://localhost:8080/io-link.html
echo.
echo Press Ctrl+C to stop the server
echo.
cd backend
python app.py
