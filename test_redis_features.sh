#!/bin/bash

# Redis功能测试脚本
BASE_URL="http://localhost:8080"
ADMIN_EMAIL="admin@example.com"
ADMIN_PASSWORD="admin123"

echo "🔍 Redis功能测试开始..."

# 1. 测试健康检查
echo "1️⃣ 测试健康检查..."
curl -s "$BASE_URL/health" | jq '.'

# 2. 测试登录(会话存储到Redis)
echo -e "\n2️⃣ 测试管理员登录(Redis会话存储)..."
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/api/admin/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}")

echo "$LOGIN_RESPONSE" | jq '.'
TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.data.access_token // empty')

if [ -z "$TOKEN" ] || [ "$TOKEN" = "null" ]; then
    echo "❌ 登录失败，无法获取token"
    exit 1
fi

echo "✅ 登录成功，Token: ${TOKEN:0:20}..."

# 3. 测试多次API调用(验证Redis缓存)
echo -e "\n3️⃣ 测试用户列表API(验证Redis缓存)..."
for i in {1..3}; do
    echo "第 $i 次调用:"
    time curl -s -H "Authorization: Bearer $TOKEN" \
        "$BASE_URL/api/admin/users" | jq '.data | length' | head -1
done

# 4. 测试仪表板统计(缓存测试)
echo -e "\n4️⃣ 测试仪表板统计(Redis缓存测试)..."
for i in {1..2}; do
    echo "第 $i 次调用:"
    time curl -s -H "Authorization: Bearer $TOKEN" \
        "$BASE_URL/api/admin/dashboard/stats" | jq '.data.total_users'
done

# 5. 创建测试任务(队列测试)
echo -e "\n5️⃣ 测试任务创建(Redis队列)..."
JOB_RESPONSE=$(curl -s -X POST "$BASE_URL/api/admin/jobs" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "test",
    "user_id": 1,
    "prompt": "测试Redis队列功能",
    "model": "test-model",
    "status": "pending"
  }')

echo "$JOB_RESPONSE" | jq '.'
JOB_ID=$(echo "$JOB_RESPONSE" | jq -r '.data.id // empty')

if [ ! -z "$JOB_ID" ] && [ "$JOB_ID" != "null" ]; then
    echo "✅ 任务创建成功，ID: $JOB_ID"
    
    # 查询任务状态
    echo -e "\n6️⃣ 查询任务状态..."
    curl -s -H "Authorization: Bearer $TOKEN" \
        "$BASE_URL/api/admin/jobs/$JOB_ID" | jq '.'
else
    echo "⚠️ 任务创建失败或返回格式异常"
fi

echo -e "\n🏁 Redis功能测试完成！"