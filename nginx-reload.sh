#!/bin/bash

# Nginx 配置重载脚本

echo "🔄 Testing Nginx configuration..."

# 测试配置
if docker exec palmr-nginx nginx -t 2>&1; then
    echo "✅ Configuration test passed"
    echo ""
    echo "🔄 Reloading Nginx..."
    
    # 重载配置
    if docker exec palmr-nginx nginx -s reload; then
        echo "✅ Nginx reloaded successfully!"
        echo ""
        echo "📊 Nginx status:"
        docker exec palmr-nginx ps aux | grep nginx
    else
        echo "❌ Failed to reload Nginx"
        exit 1
    fi
else
    echo "❌ Configuration test failed!"
    echo "Please check your Nginx configuration files"
    exit 1
fi

