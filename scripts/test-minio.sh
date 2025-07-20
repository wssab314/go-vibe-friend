#!/bin/bash

# MinIO集成测试脚本

set -e

echo "🧪 MinIO集成功能测试"
echo "===================="

# 检查依赖
command -v curl >/dev/null 2>&1 || { echo ❌ "需要安装 curl"; exit 1; }
command -v docker-compose >/dev/null 2>&1 || { echo "❌ 需要安装 docker-compose"; exit 1; }

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 测试结果变量
TESTS_PASSED=0
TESTS_FAILED=0

# 测试函数
test_step() {
    echo -e "${YELLOW}🔍 测试: $1${NC}"
}

test_pass() {
    echo -e "${GREEN}✅ 通过: $1${NC}"
    ((TESTS_PASSED++))
}

test_fail() {
    echo -e "${RED}❌ 失败: $1${NC}"
    ((TESTS_FAILED++))
}

# 1. 检查MinIO服务状态
test_step "检查MinIO服务是否运行"
if docker-compose -f docker-compose.minio.yml ps | grep -q "Up"; then
    test_pass "MinIO服务正在运行"
else
    echo "🔧 启动MinIO服务..."
    docker-compose -f docker-compose.minio.yml up -d
    sleep 10
    if docker-compose -f docker-compose.minio.yml ps | grep -q "Up"; then
        test_pass "MinIO服务启动成功"
    else
        test_fail "MinIO服务启动失败"
        exit 1
    fi
fi

# 2. 测试MinIO API连接
test_step "测试MinIO API连接"
MINIO_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:9000/minio/health/live || echo "000")
if [ "$MINIO_HEALTH" = "200" ]; then
    test_pass "MinIO API连接正常"
else
    test_fail "MinIO API连接失败 (HTTP $MINIO_HEALTH)"
fi

# 3. 测试MinIO Console访问
test_step "测试MinIO Console访问"
CONSOLE_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:9001 || echo "000")
if [ "$CONSOLE_STATUS" = "200" ]; then
    test_pass "MinIO Console访问正常"
else
    test_fail "MinIO Console访问失败 (HTTP $CONSOLE_STATUS)"
fi

# 4. 检查go-vibe-friend bucket是否存在
test_step "检查默认bucket是否创建"
# 这里我们通过检查初始化容器是否成功来判断
if docker-compose -f docker-compose.minio.yml ps minio-init | grep -q "Exit 0"; then
    test_pass "默认bucket创建成功"
else
    echo "🔧 运行bucket初始化..."
    docker-compose -f docker-compose.minio.yml run --rm minio-init
    if [ $? -eq 0 ]; then
        test_pass "bucket初始化成功"
    else
        test_fail "bucket初始化失败"
    fi
fi

# 5. 测试应用服务器连接（如果运行）
test_step "检查应用服务器状态"
APP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/health || echo "000")
if [ "$APP_STATUS" = "200" ]; then
    test_pass "应用服务器运行正常"
    
    # 测试存储API
    test_step "测试存储管理API（需要管理员token）"
    echo "💡 提示：手动测试存储API需要先获取管理员token"
    echo "   1. 访问 http://localhost:5173 登录管理员账户"
    echo "   2. 使用token调用 http://localhost:8080/api/admin/storage/objects"
    
else
    echo "⚠️  应用服务器未运行，跳过API测试"
    echo "💡 可以运行 'make dev' 启动应用服务器"
fi

# 6. 输出访问信息
echo ""
echo "🌐 MinIO服务访问信息："
echo "   API端点: http://localhost:9000"
echo "   Web Console: http://localhost:9001"
echo "   用户名: minioadmin"
echo "   密码: minioadmin123"
echo ""

# 7. 输出测试结果
echo "📊 测试结果统计："
echo "   通过: $TESTS_PASSED"
echo "   失败: $TESTS_FAILED"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 所有测试通过！MinIO集成正常工作。${NC}"
    exit 0
else
    echo -e "${RED}⚠️  有 $TESTS_FAILED 个测试失败，请检查配置。${NC}"
    exit 1
fi