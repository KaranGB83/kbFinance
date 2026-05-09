#!/bin/sh
set -e

echo ""
echo "================================================"
echo "   KB Finance is starting up..."
echo "================================================"
echo ""

echo "[1/3] Running database migrations..."
python manage.py migrate --noinput

echo "[2/3] Collecting static files..."
python manage.py collectstatic --noinput


echo "[3/3] Starting gunicorn server..."
echo ""
echo "================================================"
echo "   App is running on 0.0.0.0:8000"
echo "  Press Ctr+C to stop "
echo "================================================"
echo ""

exec gunicorn kbFinance.wsgi:application \
    --bind 0.0.0.0:8000 \
    --workers 2 \
    --access-logfile - \
    --error-logfile - 