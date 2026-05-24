#!/bin/bash

# ITRIX Social Platform - 启动脚本

echo "🚀 启动 ITRIX Social Platform..."
echo "🌐 访问地址: http://localhost:3002"
echo "📝 日志文件: nohup.out"
echo ""

# 检查是否已经在运行
if [ -f "app.pid" ]; then
    OLD_PID=$(cat app.pid)
    if ps -p $OLD_PID > /dev/null 2>&1; then
        echo "⚠️  服务已在运行 (PID: $OLD_PID)"
        echo "请先执行 ./shutdown.sh 停止服务"
        exit 1
    fi
fi

# 后台启动并保存进程号
nohup npm run start > nohup.out 2>&1 &
echo $! > app.pid

echo "✅ 服务已在后台启动 (PID: $(cat app.pid))"
echo "查看日志: tail -f nohup.out"
echo "停止服务: ./shutdown.sh"
