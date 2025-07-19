#!/bin/bash

# 测试系统健康状态和数据库容量API的脚本

echo "🚀 测试新的系统监控API..."

# 启动服务器（后台运行）
echo "启动服务器..."
./bin/server &
SERVER_PID=$!

# 等待服务器启动
sleep 3

# 获取管理员token
echo "获取管理员token..."
TOKEN_RESPONSE=$(curl -s -X POST http://localhost:8080/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}')

TOKEN=$(echo $TOKEN_RESPONSE | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
    echo "❌ 无法获取token，请检查管理员登录"
    kill $SERVER_PID
    exit 1
fi

echo "✅ 成功获取token: ${TOKEN:0:20}..."

# 测试系统健康状态API
echo ""
echo "📊 测试系统健康状态API..."
HEALTH_RESPONSE=$(curl -s -X GET http://localhost:8080/api/admin/health \
  -H "Authorization: Bearer $TOKEN")

echo "系统健康状态响应:"
echo $HEALTH_RESPONSE | jq '.' || echo $HEALTH_RESPONSE

# 测试数据库容量API
echo ""
echo "🗄️  测试数据库容量API..."
DB_RESPONSE=$(curl -s -X GET http://localhost:8080/api/admin/database/capacity \
  -H "Authorization: Bearer $TOKEN")

echo "数据库容量响应:"
echo $DB_RESPONSE | jq '.' || echo $DB_RESPONSE

# 停止服务器
echo ""
echo "🛑 停止服务器..."
kill $SERVER_PID

echo "✅ 测试完成！"