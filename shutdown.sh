#!/bin/bash

# ITRIX Social Platform - 停止脚本

echo "🛑 停止 ITRIX Social Platform..."
echo ""

# 检查 PID 文件是否存在
if [ ! -f "app.pid" ]; then
    echo "ℹ️  未找到 PID 文件 (app.pid)"
    echo "服务可能未启动或已停止"
    exit 0
fi

# 读取进程号
PID=$(cat app.pid)

# 检查进程是否存在
if ! ps -p $PID > /dev/null 2>&1; then
    echo "ℹ️  进程 $PID 不存在，服务可能已停止"
    rm -f app.pid
    exit 0
fi

# 停止进程
echo "📍 找到进程 PID: $PID"
echo "正在停止进程..."
kill $PID

# 等待进程结束
sleep 2

# 确认进程已停止
if ps -p $PID > /dev/null 2>&1; then
    echo "⚠️  进程未响应，强制终止..."
    kill -9 $PID
    sleep 1
fi

# 删除 PID 文件
rm -f app.pid

echo "✅ 服务器已成功停止"
