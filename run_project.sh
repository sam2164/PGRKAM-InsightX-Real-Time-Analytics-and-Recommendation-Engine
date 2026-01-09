#!/bin/bash

echo "Starting InsightX project..."

# ----------- BACKEND -----------
echo "Starting Django backend..."
cd ./backend || exit

# activate venv automatically (detect .venv or venv)
if [ -d "venv" ]; then
    source venv/bin/activate
elif [ -d ".venv" ]; then
    source .venv/bin/activate
else
    echo "No virtual environment found! Backend may not start correctly."
fi

# Run backend in a new terminal window
osascript <<EOF
tell application "Terminal"
    do script "cd $(pwd); python manage.py runserver"
end tell
EOF

cd ..

# ----------- FRONTEND -----------
echo " Starting React frontend..."
cd ./frontend-web || exit

# Run frontend in a new terminal window
osascript <<EOF
tell application "Terminal"
    do script "cd $(pwd); npm install; npm run dev"
end tell
EOF

echo "Both frontend & backend are running in separate windows."