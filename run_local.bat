@echo off
echo Start the backend in one terminal:
echo   cd yearbook-backend
echo   venv\Scripts\activate
echo   python -m uvicorn app.main:app --reload --port 8000
echo.
echo Start the frontend in another terminal:
echo   cd yearbook-frontend
echo   npm run dev
pause
