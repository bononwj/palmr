#!/bin/bash

# Nginx 日志查看脚本

echo "📋 Palmr Nginx Logs"
echo "=================="
echo ""
echo "Options:"
echo "  1) Access logs (real-time)"
echo "  2) Error logs (real-time)"
echo "  3) Access logs (last 100 lines)"
echo "  4) Error logs (last 100 lines)"
echo "  5) All logs (real-time)"
echo ""

read -p "Select option (1-5): " option

case $option in
    1)
        echo "📊 Showing access logs (Ctrl+C to exit)..."
        docker exec palmr-nginx tail -f /var/log/nginx/palmr_access.log
        ;;
    2)
        echo "⚠️  Showing error logs (Ctrl+C to exit)..."
        docker exec palmr-nginx tail -f /var/log/nginx/palmr_error.log
        ;;
    3)
        echo "📊 Last 100 access logs:"
        docker exec palmr-nginx tail -100 /var/log/nginx/palmr_access.log
        ;;
    4)
        echo "⚠️  Last 100 error logs:"
        docker exec palmr-nginx tail -100 /var/log/nginx/palmr_error.log
        ;;
    5)
        echo "📋 Showing all logs (Ctrl+C to exit)..."
        docker-compose -f docker-compose-nginx.yaml logs -f nginx
        ;;
    *)
        echo "❌ Invalid option"
        exit 1
        ;;
esac

